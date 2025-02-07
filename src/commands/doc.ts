import type { Command, CommandGenerator, CommandOptions } from '../types.ts';
import type { Config } from '../config.ts';
import { loadConfig, loadEnv } from '../config.ts';
import { readFileSync, writeFileSync } from 'node:fs';
import { pack } from 'repomix';
import { ignorePatterns, includePatterns, outputOptions } from '../repomix/repomixConfig.ts';
interface DocCommandOptions extends CommandOptions {
  output?: string; // Optional output file path
  fromGithub?: string; // GitHub URL or username/reponame
}

export class DocCommand implements Command {
  private config: Config;

  constructor() {
    loadEnv();
    this.config = loadConfig();
  }

  private parseGithubUrl(url: string): { username: string; reponame: string; branch?: string } {
    // Handle full HTTPS URL format
    if (url.startsWith('https://github.com/')) {
      const parts = url.replace('https://github.com/', '').split('/');
      const [username, repoWithBranch] = parts;
      const [reponame, branch] = repoWithBranch.split('@');
      return { username, reponame, branch };
    }

    // Handle username/reponame@branch format
    const [repoPath, branch] = url.split('@');
    const parts = repoPath.split('/');
    if (parts.length !== 2) {
      throw new Error(
        'Invalid GitHub repository format. Use either https://github.com/username/reponame[@branch] or username/reponame[@branch]'
      );
    }

    return { username: parts[0], reponame: parts[1], branch };
  }

  private async getGithubRepoContext(
    githubUrl: string
  ): Promise<{ text: string; tokenCount: number }> {
    const { username, reponame, branch } = this.parseGithubUrl(githubUrl);
    const repoIdentifier = `${username}/${reponame}`;

    // First check repository size using GitHub API
    console.error('Checking repository size...');
    const sizeResponse = await fetch(`https://api.github.com/repos/${username}/${reponame}`);
    if (sizeResponse.ok) {
      const repoInfo = await sizeResponse.json();
      const sizeInMB = repoInfo.size / 1024; // size is in KB, convert to MB
      const maxSize = this.config.doc?.maxRepoSizeMB || 100; // Default to 100MB if not configured

      console.error(`Repository size: ${Math.round(sizeInMB)}MB (limit: ${maxSize}MB)`);

      // If repo is larger than the limit, throw an error
      if (sizeInMB > maxSize) {
        throw new Error(
          `Repository ${repoIdentifier} is too large (${Math.round(sizeInMB)}MB) to process remotely.\n` +
            `The current size limit is ${maxSize}MB. You can:\n` +
            `1. Increase the limit by setting doc.maxRepoSizeMB in cursor-tools.config.json\n` +
            `2. Clone the repository locally and run cursor-tools doc without --fromGithub\n` +
            `3. The local processing will be more efficient and can handle larger codebases`
        );
      }
    } else {
      console.error('Could not determine repository size, proceeding anyway...');
    }

    console.error(
      'Fetching GitHub repository:',
      repoIdentifier,
      branch ? `(branch: ${branch})` : ''
    );

    const MAX_RETRIES = 3;
    const INITIAL_DELAY = 1000; // 1 second

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch('https://api.repomix.com/api/pack', {
          headers: {
            'content-type': 'application/json',
            Referer: 'https://repomix.com/',
          },
          body: JSON.stringify({
            url: repoIdentifier,
            ref: branch,
            format: 'xml',
            options: {
              removeComments: false,
              removeEmptyLines: true,
              showLineNumbers: false,
              fileSummary: true,
              directoryStructure: true,
              outputParsable: false,
              includePatterns: includePatterns.join(','),
              ignorePatterns: ignorePatterns.join(','),
            },
            signal: {},
          }),
          method: 'POST',
        });

        if (response.ok) {
          const responseText = await response.text();
          try {
            // Try to parse as JSON to get metadata
            const responseJson = JSON.parse(responseText);
            const tokenCount = responseJson.metadata?.summary?.totalTokens;
            console.error(
              `Repository content token count (approximately): ${Math.round(tokenCount / 1000)}K tokens`
            );
            return { text: responseText, tokenCount: tokenCount || 0 };
          } catch {
            // If parsing fails, return the text without token count
            console.error(
              'Could not parse token count from response, proceeding without token information'
            );
            return { text: responseText, tokenCount: 0 };
          }
        }

        const errorText = await response.text();

        // Check if error might be size-related
        if (
          errorText.toLowerCase().includes('timeout') ||
          errorText.toLowerCase().includes('too large')
        ) {
          throw new Error(
            `Repository ${repoIdentifier} appears to be too large to process remotely.\n` +
              `Please:\n` +
              `1. Clone the repository locally\n` +
              `2. Run cursor-tools doc without --fromGithub\n` +
              `3. The local processing will be more efficient and can handle larger codebases`
          );
        }

        // If this is the last attempt, throw the error
        if (attempt === MAX_RETRIES) {
          throw new Error(
            `Failed to fetch GitHub repository context: ${response.statusText}\n${errorText}`
          );
        }

        // For 5xx errors (server errors) and 429 (rate limit), retry
        // For other errors (like 4xx client errors), throw immediately
        if (!(response.status >= 500 || response.status === 429)) {
          throw new Error(
            `Failed to fetch GitHub repository context: ${response.statusText}\n${errorText}`
          );
        }

        // Calculate delay with exponential backoff and jitter
        const delay = INITIAL_DELAY * Math.pow(2, attempt - 1) * (0.5 + Math.random());
        console.error(
          `Attempt ${attempt} failed. Retrying in ${Math.round(delay / 1000)} seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        // If this is the last attempt, rethrow the error
        if (attempt === MAX_RETRIES) {
          throw error;
        }

        // For network errors (like timeouts), retry
        if (error instanceof Error) {
          const delay = INITIAL_DELAY * Math.pow(2, attempt - 1) * (0.5 + Math.random());
          console.error(`Attempt ${attempt} failed: ${error.message}`);
          console.error(`Retrying in ${Math.round(delay / 1000)} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // This should never be reached due to the throw in the last iteration
    throw new Error('Failed to fetch GitHub repository context after all retries');
  }

  private async fetchOpenRouterDocResponse(
    repoContext: { text: string; tokenCount: number },
    options?: DocCommandOptions
  ): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }

    const model = options?.model || this.config.gemini.model;

    // Define a prompt for Gemini to generate documentation
    let query = `
Focus on:
1. Repository purpose and "what is it" summary
2. Quick start: How to install and use the basic core features of the project
4. Configuration options and how to configure the project for use (if applicable)
3. If a repository has multiple public packages perform all the following steps for every package:
4. package summary & how to install / import it 
5. Detailed documentation of every public feature / API / interface
6. Dependencies and requirements
7. Advanced usage examples`;

    // Add hint if provided
    if (options?.hint) {
      query += `\n\nAdditional guidance:\n${options.hint}`;
    }

    console.error('Using OpenRouter model:', model);
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'HTTP-Referer': 'https://github.com/husniadil/cursor-tools',
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that generates public user-facing documentation for a given repository. You will be given a repository context and possibly a query to create docs for a specific part or function, if this is not provided generate docs for all public interfaces and features. Generate a comprehensive documentation with all necessary information BUT stick to short simple sentences and avoid being wordy, verbose or making a sales-pitch, stick to factual statements and be concise. Format the documentation in markdown unless otherwise specified.',
          },
          {
            role: 'user',
            content: repoContext.text + '\n\n' + query,
          },
        ],
        max_tokens: options?.maxTokens || this.config.gemini.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`OpenRouter API error: ${JSON.stringify(data.error, null, 2)}`);
    }

    return data.choices[0].message.content;
  }

  async *execute(query: string, options?: DocCommandOptions): CommandGenerator {
    try {
      console.error('Generating repository documentation...\n');

      let repoContext: { text: string; tokenCount: number };

      if (options?.fromGithub) {
        console.error(`Fetching repository context for ${options.fromGithub}...\n`);
        repoContext = await this.getGithubRepoContext(options.fromGithub);
      } else {
        console.error('Packing local repository using repomix...\n');
        const tempFile = '.repomix-output.txt';
        await pack(process.cwd(), {
          output: {
            ...outputOptions,
            filePath: tempFile,
          },
          include: ['**/*'],
          ignore: {
            useGitignore: true,
            useDefaultPatterns: true,
            customPatterns: ignorePatterns,
          },
          security: {
            enableSecurityCheck: true,
          },
          tokenCount: {
            encoding: this.config.tokenCount?.encoding || 'o200k_base',
          },
          cwd: process.cwd(),
        });

        repoContext = { text: readFileSync(tempFile, 'utf-8'), tokenCount: 0 };
      }

      console.error('Generating documentation using OpenRouter AI...\n');
      const documentation = await this.fetchOpenRouterDocResponse(repoContext, options);

      // Save to file if output option is provided
      if (options?.output) {
        writeFileSync(options.output, documentation);
        console.error(`Documentation saved to ${options.output}\n`);
      } else {
        yield '\n--- Repository Documentation ---\n\n';
        yield documentation;
        yield '\n\n--- End of Documentation ---\n';
      }

      console.error('Documentation generation completed!\n');
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error('An unknown error occurred');
      }
    }
  }
}
