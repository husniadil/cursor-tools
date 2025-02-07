
--- Repository Documentation ---

```markdown
--- Repository Documentation ---

# Cursor Tools Documentation

## Repository Purpose and Summary

`cursor-tools` enhances AI-powered development environments. It provides a CLI for web queries and codebase understanding using Perplexity AI and Google Gemini.

## Quick Start

1.  **Installation:**

    Run:
    ```bash
    npx cursor-tools@latest install .
    ```
    This installs `cursor-tools`, configures API keys, and updates `.cursorrules`.

2.  **Basic Usage:**

    *   **Web Search (Perplexity AI):**
        ```bash
        cursor-tools web "Your question here"
        ```
    *   **Repository Context (Google Gemini):**
        ```bash
        cursor-tools repo "Your question about the codebase"
        ```
    *   **Documentation (Google Gemini):**
        ```bash
        cursor-tools doc "Generate documentation"
        ```

## Configuration

### API Keys

`cursor-tools` requires API keys for Perplexity AI and Google Gemini. Setup:

1.  **Interactive Setup**: `cursor-tools install` guides you through the process.
2.  **Manual Setup**: Create `.cursor-tools.env` in your project root, or `~/.cursor-tools/.env` in home directory:

    ```
    OPENROUTER_API_KEY="your-perplexity-api-key"
    ```

### Default Settings

Customize settings in `cursor-tools.config.json` file:

```json
{
  "perplexity": {
    "model": "perplexity/sonar",
    "maxTokens": 8000
  },
  "gemini": {
    "model": "google/gemini-2.0-flash-001",
    "maxTokens": 10000
  },
  "doc": {
      "maxRepoSizeMB": 100
  },
  "tokenCount": {
    "encoding": "o200k_base"
  },
   "browser": {
    "headless": true,
    "defaultViewport": "1280x720",
    "timeout": 30000
  }
}
```

## Core Features / API / Interfaces

### 1. `web` Command

Performs web searches using Perplexity AI.

**Interface:**

```typescript
interface Command {
  execute(query: string, options?: CommandOptions): CommandGenerator;
}

type CommandGenerator = AsyncGenerator<string, void, unknown>;

interface CommandOptions {
  model?: string;
  maxTokens?: number;
  saveTo?: string;
  hint?: string;
}
```

**Usage:**

```bash
cursor-tools web "What is the latest version of React?"
cursor-tools web --model perplexity/sonar "Explain quantum computing"
cursor-tools web "How do I use fetch in JavaScript?" --max-tokens 500 --save-to output.txt
```

**Dependencies:**

-   OpenRouter API key.
-   `eventsource-client`.

### 2. `repo` Command

Provides context-aware answers about the current repository using Google Gemini.

**Interface:**  (Uses the same `Command` and `CommandOptions` interfaces as `web`.)

**Usage:**

```bash
cursor-tools repo "Explain the purpose of the src/config.ts file"
cursor-tools repo "How does authentication work in this project?" --model gemini-pro
cursor-tools repo "List all public functions in src/commands/index.ts" --save-to functions.txt
```

**Dependencies:**

-   OpenRouter API key.
-   `repomix`.

### 3. `doc` Command

Generates documentation for a repository.

**Interface:** (Uses the same `Command` interfaces as `web`).

```typescript
interface DocCommandOptions extends CommandOptions {
  output?: string;
  fromGithub?: string;
}
```

**Usage:**

```bash
cursor-tools doc
cursor-tools doc --output docs.md
cursor-tools doc --from-github husniadil/cursor-tools
cursor-tools doc --from-github husniadil/cursor-tools@main --output cursor-tools-docs.md

```

**Dependencies:**

-   OpenRouter API key.
-   `repomix`.
-   `node:fs`.

### 4. `github` Command
Accesses information from GitHub, including pull requests and issues.
**Interface:**
```typescript
interface GithubOptions extends CommandOptions {
  repo?: string;
  fromGithub?: string;
}
```

**Subcommands:**

- `pr`: Accesses pull request information. <br/>
    **Usage**:
    ```bash
    cursor-tools github pr
    cursor-tools github pr 123
    cursor-tools github pr --from-github owner/repo
    cursor-tools github pr 123 --from-github owner/repo
    ```
- `issue`: Accesses issue information. <br/>
     **Usage**:
    ```bash
    cursor-tools github issue
    cursor-tools github issue 456
    cursor-tools github issue --from-github owner/repo
    cursor-tools github issue 456 --from-github owner/repo
    ```
**Dependencies:**

-   GitHub authentication.

### 5. `install` command
Installs `cursor-tools` into a repository.

**Interface:**

```typescript
interface InstallOptions extends CommandOptions {
  packageManager?: 'npm' | 'yarn' | 'pnpm';
}
```
**Usage:**

```bash
npx cursor-tools@latest install .
```
**Dependencies:**

-   `node:fs`.
-   `node:path`.
-   `node:os`.

### 6. `browser` command

Provides web automation capabilities. Install peer dependency:
```bash
npm install playwright
# or
yarn add playwright
# or
pnpm add playwright
```
**Subcommands:**

- `open`: command: <br/>
```bash
# Open url, capture html.
cursor-tools browser open "https://example.com" --html
cursor-tools browser open "https://example.com" --console --network
cursor-tools browser open "https://example.com" --screenshot="page.png"
cursor-tools browser open "https://example.com" --no-headless
```
- `element`: command:
```bash
# Open url, capture html.
cursor-tools browser element --url "https://example.com" --selector "#product-title" --text
cursor-tools browser element --url "https://example.com" --selector ".main-content" --html --save-to "content.html"
cursor-tools browser element --url "https://example.com" --selector ".ad-banner" --screenshot "banner.png"
```

## GitHub Authentication

The `github` command authentication methods:

1.  `GITHUB_TOKEN` environment variable.
2.  GitHub CLI (`gh`).
3.  Git Credentials. Unauthenticated access has lower rate limits.

## Dependencies

-   Node.js 18 or later
-   Perplexity API key
-   Google Gemini API key
-   `dotenv`
-   `eventsource-client`
-   `repomix`
-   `playwright` (peer dependency)

## Advanced Usage Examples

- Combine commands.
- Use hints.
- Automate documentation updates.
- Integrate with GitHub Actions.

--- End of Documentation ---
```
</file>

--- End of Documentation ---
