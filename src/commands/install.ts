import type { Command, CommandGenerator, CommandOptions } from '../types.ts';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { loadEnv } from '../config.ts';
import { CURSOR_RULES_TEMPLATE, CURSOR_RULES_VERSION } from '../cursorrules.ts';

interface InstallOptions extends CommandOptions {
  packageManager?: 'npm' | 'yarn' | 'pnpm';
}

// Helper function to get user input and properly close stdin
async function getUserInput(prompt: string): Promise<string> {
  return new Promise<string>((resolve) => {
    process.stdout.write(prompt);
    const onData = (data: Buffer) => {
      const input = data.toString().trim().toLowerCase();
      process.stdin.removeListener('data', onData);
      process.stdin.pause();
      resolve(input);
    };
    process.stdin.resume();
    process.stdin.once('data', onData);
  });
}

export class InstallCommand implements Command {
  private async *setupApiKeys(): CommandGenerator {
    loadEnv(); // Load existing env files if any

    const homeEnvPath = join(homedir(), '.cursor-tools', '.env');
    const localEnvPath = join(process.cwd(), '.cursor-tools.env');

    // Check if keys are already set
    if (process.env.OPENROUTER_API_KEY) {
      return;
    }

    // Function to write keys to a file
    const writeKeysToFile = (filePath: string, openRouterApiKey: string) => {
      const envContent = `OPENROUTER_API_KEY=${openRouterApiKey}\n`;
      const dir = join(filePath, '..');
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(filePath, envContent, 'utf-8');
    };

    // Try to write to home directory first, fall back to local if it fails
    try {
      const openRouterKey = process.env.OPENROUTER_API_KEY || '';

      if (!openRouterKey) {
        const key = await getUserInput('Enter your OpenRouter API key (or press Enter to skip): ');
        process.env.OPENROUTER_API_KEY = key;
      }

      try {
        writeKeysToFile(homeEnvPath, process.env.OPENROUTER_API_KEY || '');
        yield 'API keys written to ~/.cursor-tools/.env\n';
      } catch (error) {
        console.error('Error writing API keys to home directory:', error);
        // Fall back to local file if home directory write fails
        writeKeysToFile(localEnvPath, process.env.OPENROUTER_API_KEY || '');
        yield 'API keys written to .cursor-tools.env in the current directory\n';
      }
    } catch (error) {
      console.error('Error setting up API keys:', error);
      yield 'Error setting up API keys. You can add them later manually.\n';
    }
  }

  async *execute(targetPath: string, options?: InstallOptions): CommandGenerator {
    const packageManager = options?.packageManager || 'npm/yarn/pnpm';
    const absolutePath = join(process.cwd(), targetPath);

    // 1. Add cursor-tools to package.json as a dev dependency if it exists
    const packageJsonPath = join(absolutePath, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const currentVersion =
          packageJson.devDependencies?.['cursor-tools'] ||
          packageJson.dependencies?.['cursor-tools'];

        if (currentVersion === 'latest') {
          yield 'cursor-tools is already installed at latest version.\n';
        } else if (currentVersion) {
          yield `Found cursor-tools version ${currentVersion}. Would you like to update to latest? (y/N): `;
          const answer = await getUserInput('');

          if (answer === 'y' || answer === 'yes') {
            if (!packageJson.devDependencies) {
              packageJson.devDependencies = {};
            }
            packageJson.devDependencies['cursor-tools'] = 'latest';
            // Remove from dependencies if it exists there
            if (packageJson.dependencies?.['cursor-tools']) {
              delete packageJson.dependencies['cursor-tools'];
            }
            writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
            yield `Updated cursor-tools to latest version. Please run \`${packageManager} install\` to complete the update.\n`;
          } else {
            yield 'Keeping current version.\n';
          }
        } else {
          const answer = await getUserInput(
            'Would you like to add cursor-tools as a dev dependency to package.json? (y/N): '
          );

          if (answer === 'y' || answer === 'yes') {
            yield 'Adding cursor-tools as a dev dependency to package.json...\n';
            if (!packageJson.devDependencies) {
              packageJson.devDependencies = {};
            }
            packageJson.devDependencies['cursor-tools'] = 'latest';
            writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
            yield `Please run \`${packageManager} install\` to complete the installation.\n`;
          } else {
            yield 'Skipping dev dependency installation.\n';
          }
        }
      } catch (error) {
        yield `Error updating package.json: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
        return;
      }
    } else {
      yield 'No package.json found - skipping dependency installation\n';
    }

    // 2. Setup API keys
    yield 'Checking API keys setup...\n';
    yield* this.setupApiKeys();

    // 3. Update/create .cursorrules
    try {
      yield 'Checking .cursorrules...\n';
      const cursorRulesPath = join(absolutePath, '.cursorrules');

      let existingContent = '';
      let needsUpdate = true;

      if (existsSync(cursorRulesPath)) {
        existingContent = readFileSync(cursorRulesPath, 'utf-8');

        // Check if cursor-tools section exists and version matches
        const startTag = '<cursor-tools Integration>';
        const endTag = '</cursor-tools Integration>';
        const versionMatch = existingContent.match(/<!-- cursor-tools-version: ([\d.]+) -->/);
        const currentVersion = versionMatch ? versionMatch[1] : '0';

        if (
          existingContent.includes(startTag) &&
          existingContent.includes(endTag) &&
          currentVersion === CURSOR_RULES_VERSION
        ) {
          needsUpdate = false;
          yield '.cursorrules is up to date.\n';
        } else {
          yield `Updating .cursorrules from version ${currentVersion} to ${CURSOR_RULES_VERSION}...\n`;
        }
      } else {
        yield 'Creating new .cursorrules file...\n';
      }

      if (needsUpdate) {
        // Replace existing cursor-tools section or append if not found
        const startTag = '<cursor-tools Integration>';
        const endTag = '</cursor-tools Integration>';
        const startIndex = existingContent.indexOf(startTag);
        const endIndex = existingContent.indexOf(endTag);

        if (startIndex !== -1 && endIndex !== -1) {
          // Replace existing section
          const newContent =
            existingContent.slice(0, startIndex) +
            CURSOR_RULES_TEMPLATE.trim() +
            existingContent.slice(endIndex + endTag.length);
          writeFileSync(cursorRulesPath, newContent);
        } else {
          // Append new section
          writeFileSync(cursorRulesPath, existingContent + CURSOR_RULES_TEMPLATE);
        }
      }

      yield 'Installation completed successfully!\n';
    } catch (error) {
      yield `Error updating .cursorrules: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
    }
  }
}
