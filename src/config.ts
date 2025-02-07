export interface Config {
  perplexity: {
    model: string;
    apiKey?: string;
    maxTokens?: number;
  };
  gemini: {
    model: string;
    apiKey?: string;
    maxTokens?: number;
  };
  doc?: {
    maxRepoSizeMB?: number; // Maximum repository size in MB for remote processing
  };
  tokenCount?: {
    encoding: 'o200k_base' | 'gpt2' | 'r50k_base' | 'p50k_base' | 'p50k_edit' | 'cl100k_base'; // The tokenizer encoding to use
  };
  browser?: {
    headless?: boolean; // Default headless mode (true/false)
    defaultViewport?: string; // Default viewport size (e.g. '1280x720')
    timeout?: number; // Default navigation timeout in milliseconds
  };
}

export const defaultConfig: Config = {
  perplexity: {
    model: 'perplexity/sonar',
    maxTokens: 4000,
  },
  gemini: {
    model: 'google/gemini-2.0-flash-001',
    maxTokens: 10000,
  },
  doc: {
    maxRepoSizeMB: 100, // Default to 100MB
  },
  tokenCount: {
    encoding: 'o200k_base', // Default to o200k_base as it's optimized for Gemini
  },
  browser: {
    headless: true,
    defaultViewport: '1280x720',
    timeout: 30000, // 30 seconds
  },
};

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import dotenv from 'dotenv';

export function loadConfig(): Config {
  // Try loading from current directory first
  try {
    const localConfigPath = join(process.cwd(), 'cursor-tools.config.json');
    const localConfig = JSON.parse(readFileSync(localConfigPath, 'utf-8'));
    return { ...defaultConfig, ...localConfig };
  } catch {
    // If local config doesn't exist, try home directory
    try {
      const homeConfigPath = join(homedir(), '.cursor-tools', 'config.json');
      const homeConfig = JSON.parse(readFileSync(homeConfigPath, 'utf-8'));
      return { ...defaultConfig, ...homeConfig };
    } catch {
      // If neither config exists, return default config
      return defaultConfig;
    }
  }
}

export function loadEnv(): void {
  // Try loading from current directory first
  const localEnvPath = join(process.cwd(), '.cursor-tools.env');
  if (existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath });
    return;
  }

  // If local env doesn't exist, try home directory
  const homeEnvPath = join(homedir(), '.cursor-tools', '.env');
  if (existsSync(homeEnvPath)) {
    dotenv.config({ path: homeEnvPath });
    return;
  }

  // If neither env file exists, continue without loading
  return;
}
