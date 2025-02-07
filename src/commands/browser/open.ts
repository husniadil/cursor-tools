import type { Command, CommandGenerator, CommandOptions } from '../../types';
import { chromium } from 'playwright';
import { loadConfig } from '../../config.ts';
import { ensurePlaywright } from './utils.ts';

interface OpenBrowserOptions extends CommandOptions {
  url?: string;
  console?: boolean;
  html?: boolean;
  screenshot?: string;
  network?: boolean;
  timeout?: number;
  viewport?: string;
  headless?: boolean;
  connectTo?: number;
  wait?: string;
}

// Helper function to parse time duration string to milliseconds
function parseTimeDuration(duration: string): number | null {
  const timeRegex = /^(\d+)(ms|s|m)$/;
  const match = duration.match(timeRegex);
  if (!match) return null;

  const [, value, unit] = match;
  const numValue = parseInt(value, 10);

  switch (unit) {
    case 'ms':
      return numValue;
    case 's':
      return numValue * 1000;
    case 'm':
      return numValue * 60 * 1000;
    default:
      return null;
  }
}

// Helper function to parse wait parameter
function parseWaitParameter(wait: string): { type: 'time' | 'selector'; value: string | number } {
  // Check for explicit prefixes first
  if (wait.startsWith('time:')) {
    const duration = parseTimeDuration(wait.slice(5));
    if (duration === null) {
      throw new Error(
        `Invalid time duration format: ${wait}. Expected format: time:Xs, time:Xms, or time:Xm`
      );
    }
    return { type: 'time', value: duration };
  }

  if (wait.startsWith('selector:') || wait.startsWith('css:')) {
    const selector = wait.includes(':') ? wait.slice(wait.indexOf(':') + 1) : wait;
    return { type: 'selector', value: selector };
  }

  // Try parsing as time duration
  const duration = parseTimeDuration(wait);
  if (duration !== null) {
    return { type: 'time', value: duration };
  }

  // If it starts with # or ., treat as CSS selector
  if (wait.startsWith('#') || wait.startsWith('.')) {
    return { type: 'selector', value: wait };
  }

  // Default to treating as CSS selector
  return { type: 'selector', value: wait };
}

// Helper function to format console message with location and stack if available
async function formatConsoleMessage(msg: any): Promise<string> {
  const type = msg.type();
  const text = msg.text();
  const location = msg.location();
  let formattedMsg = `Browser Console (${type}): ${text}`;

  // Add location information if available
  if (location.url) {
    formattedMsg += `\n    at ${location.url}`;
    if (location.lineNumber) {
      formattedMsg += `:${location.lineNumber}`;
      if (location.columnNumber) {
        formattedMsg += `:${location.columnNumber}`;
      }
    }
  }

  // For errors, try to get the stack trace
  if (type === 'error') {
    try {
      const args = await Promise.all(msg.args().map((arg: any) => arg.jsonValue()));
      const errorDetails = args.find(
        (arg: unknown) => arg && typeof arg === 'object' && 'stack' in arg
      );
      if (errorDetails?.stack) {
        formattedMsg += `\n${errorDetails.stack}`;
      }
    } catch {
      // Ignore errors in getting stack trace
    }
  }

  return formattedMsg;
}

export class OpenCommand implements Command {
  private config = loadConfig();

  async *execute(query: string, options?: OpenBrowserOptions): CommandGenerator {
    try {
      // Check for Playwright availability first
      await ensurePlaywright();

      // Parse options from query if not provided
      if (!options?.url && query) {
        options = { ...options, url: query };
      }

      if (!options?.url) {
        yield 'Please provide a URL to open. Usage: cursor-tools browser open <url> [options]';
        return;
      }

      const url = options.url; // Store URL to ensure TypeScript knows it's defined

      // Set default values for html, network, and console options if not provided
      options = {
        ...options,
        html: options.html === undefined ? true : options.html,
        network: options.network === undefined ? true : options.network,
        console: options.console === undefined ? true : options.console,
      };

      const browserType = chromium;
      let browser;
      let consoleMessages: string[] = [];
      let networkMessages: string[] = [];

      try {
        if (options.connectTo) {
          yield `Connecting to existing Chrome instance on port ${options.connectTo}...`;
          browser = await browserType.connectOverCDP(`http://localhost:${options.connectTo}`);
        } else {
          yield 'Launching browser...';
          browser = await browserType.launch({
            headless:
              options.headless !== undefined
                ? options.headless
                : (this.config.browser?.headless ?? true),
          });
        }

        // Create a context with favicon loading enabled
        const context = await browser.newContext({
          serviceWorkers: 'allow',
          extraHTTPHeaders: {
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          },
        });
        const page = await context.newPage();

        // Set up route interception before anything else
        if (options.network === true) {
          await page.route('**/*', async (route) => {
            const request = route.request();
            networkMessages.push(
              `Network Request: ${request.method()} ${request.url()} (${request.resourceType()})`
            );

            try {
              const response = await route.fetch();
              const status = response.status();
              let message = `Network Response: ${status}`;

              // Add status text for non-200 responses
              if (status !== 200) {
                message += ` (${response.statusText()})`;
              }

              message += ` ${response.url()}`;

              // For failed responses (4xx, 5xx), try to get the response body
              if (status >= 400) {
                try {
                  const text = await response.text();
                  message += `\n    Response: ${text.slice(0, 200)}${text.length > 200 ? '...' : ''}`;
                } catch {
                  message += '\n    Could not read response body';
                }
              }

              networkMessages.push(message);
              await route.fulfill({ response });
            } catch (error) {
              networkMessages.push(
                `Network Error: ${request.method()} ${request.url()} (${request.resourceType()}) - ${error instanceof Error ? error.message : 'Unknown error'}`
              );
              await route.abort();
            }
          });
        }

        if (options.viewport) {
          const [width, height] = options.viewport.split('x').map(Number);
          if (!isNaN(width) && !isNaN(height)) {
            await page.setViewportSize({ width, height });
          } else {
            yield `Invalid viewport format: ${options.viewport}. Expected format: <width>x<height> (e.g. 1280x720)`;
          }
        } else if (this.config.browser?.defaultViewport) {
          const [width, height] = this.config.browser.defaultViewport.split('x').map(Number);
          if (!isNaN(width) && !isNaN(height)) {
            await page.setViewportSize({ width, height });
          }
        }

        // Set up error handling and monitoring only if console output is enabled
        if (options.console === true) {
          // Listen for all console messages
          page.on('console', async (msg) => {
            consoleMessages.push(await formatConsoleMessage(msg));
          });

          // Listen for page errors
          page.on('pageerror', (error) => {
            consoleMessages.push(
              `Browser Console (error): Uncaught ${error.message}\n${error.stack || ''}`
            );
          });
        }

        yield `Navigating to ${url}...`;
        await page.goto(url, { timeout: options.timeout ?? this.config.browser?.timeout ?? 30000 });

        // Handle wait parameter if provided
        if (options.wait) {
          try {
            const waitConfig = parseWaitParameter(options.wait);
            yield `Waiting for ${waitConfig.type === 'time' ? `${waitConfig.value}ms` : `selector "${waitConfig.value}"`}...`;

            if (waitConfig.type === 'time') {
              await page.waitForTimeout(waitConfig.value as number);
            } else {
              await page.waitForSelector(waitConfig.value as string, {
                state: 'visible',
                timeout: options.timeout ?? this.config.browser?.timeout ?? 30000,
              });
            }
          } catch (error) {
            yield `Wait error: ${error instanceof Error ? error.message : 'Unknown error'}\n`;
          }
        }

        // Output console messages if explicitly enabled
        if (options.console === true && consoleMessages.length > 0) {
          yield '\n--- Console Messages ---\n\n';
          for (const msg of consoleMessages) {
            yield msg + '\n';
          }
          yield '--- End of Console Messages ---\n\n';
        }

        // Output network messages if explicitly enabled
        if (options.network === true && networkMessages.length > 0) {
          yield '\n--- Network Activity ---\n\n';
          for (const msg of networkMessages) {
            yield msg + '\n';
          }
          yield '--- End of Network Activity ---\n\n';
        }

        // Only output HTML content if explicitly enabled
        if (options.html === true) {
          const htmlContent = await page.content();
          yield '\n--- Page HTML Content ---\n\n';
          yield htmlContent;
          yield '\n--- End of HTML Content ---\n';
        }

        if (options.screenshot) {
          yield `Taking screenshot and saving to ${options.screenshot}...`;
          await page.screenshot({ path: options.screenshot, fullPage: true });
          yield 'Screenshot saved.\n';
        }
      } catch (error) {
        yield `Browser command error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      } finally {
        if (browser) {
          await browser.close();
          yield 'Browser closed.\n';
        }
      }
    } catch (error) {
      yield `Playwright check error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}
