import type { Command, CommandGenerator, CommandOptions } from '../types.ts';
import type { Config } from '../config.ts';
import { loadConfig, loadEnv } from '../config.ts';
import { readFileSync } from 'node:fs';
import { pack } from 'repomix';
import { ignorePatterns, includePatterns, outputOptions } from '../repomix/repomixConfig.ts';
export class RepoCommand implements Command {
  private config: Config;

  constructor() {
    loadEnv();
    this.config = loadConfig();
  }

  private async fetchOpenRouterResponse(
    query: string,
    repoContext: string,
    options?: CommandOptions
  ): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }

    let cursorRules = '';
    try {
      cursorRules = readFileSync('.cursorrules', 'utf-8');
    } catch {
      // Ignore if .cursorrules doesn't exist
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'HTTP-Referer': 'https://github.com/husniadil/cursor-tools',
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options?.model || this.config.gemini.model,
        messages: [
          {
            role: 'system',
            content: cursorRules,
          },
          {
            role: 'user',
            content: repoContext + '\n\n' + query,
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

  async *execute(query: string, options?: CommandOptions): CommandGenerator {
    try {
      yield 'Packing repository using repomix...\n';

      await pack(process.cwd(), {
        output: {
          ...outputOptions,
          filePath: '.repomix-output.txt',
        },
        include: includePatterns,
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

      const repoContext = readFileSync('.repomix-output.txt', 'utf-8');

      const model = options?.model || this.config.gemini.model;
      yield `Querying OpenRouter AI using ${model}...\n`;
      const response = await this.fetchOpenRouterResponse(query, repoContext, options);
      yield response;
    } catch (error) {
      if (error instanceof Error) {
        yield `Error: ${error.message}`;
      } else {
        yield 'An unknown error occurred';
      }
    }
  }
}
