
--- Repository Documentation ---

```markdown
--- Repository Documentation ---

# Cursor Tools Documentation

## Repository Purpose and Summary

`cursor-tools` enhances AI-powered development workflows. It provides a CLI for web queries, repo context, and documentation generation using Perplexity AI and Google Gemini.

## Quick Start

1.  **Installation:**

    Run:

    ```bash
    npx cursor-tools@latest install .
    ```

    This installs `cursor-tools`, configures API keys, and updates `.cursorrules`.
2.  **Perplexity Search**
    ```bash
    cursor-tools web "query"
    ```
3.  **Repository Context**
    ```bash
    cursor-tools repo "query"
    ```
4.  **Documentation Generation**
    ```bash
    cursor-tools doc
    ```

## Configuration

### API Keys

`cursor-tools` requires API keys for Perplexity AI and Google Gemini.

1.  **Interactive Setup**: `cursor-tools install` guides you through the process.
2.  **Manual Setup**: Create `.cursor-tools.env` in your project root, or `~/.cursor-tools/.env` in home directory:

    ```
    OPENROUTER_API_KEY="your-openrouter-api-key"
    ```

### Default Settings

Customize `cursor-tools` behavior by creating a `cursor-tools.config.json` file in the project root or `~/.cursor-tools/.env` in your home directory.

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

**Usage:**

```bash
cursor-tools web "What is the latest version of React?"
```

**Options:**

-   `--model`: Perplexity model name.
-   `--maxTokens`: Maximum tokens in response.
-   `--saveTo`: Path to save output.
-   `--hint`: Additional context for AI.

### 2. `repo` Command

Provides context-aware answers about the current repository using Google Gemini.

**Usage:**

```bash
cursor-tools repo "Explain the purpose of the src/config.ts file"
```

**Options:**

-   `--model`: Gemini model name.
-   `--maxTokens`: Maximum tokens in response.
-   `--saveTo`: Path to save output.
-   `--hint`: Additional context for AI.

### 3. `doc` Command

Generates documentation for a repository.

**Usage:**

```bash
cursor-tools doc
```

**Options:**

-   `--output`: Output file path.
-   `--fromGithub`: GitHub URL or `username/reponame[@branch]`.
-   `--model`: Gemini model name.
-   `--maxTokens`: Maximum tokens in response.
-   `--hint`: Additional context for AI.

#### Remote Repository Documentation

The `doc` command supports documenting remote GitHub repositories:

```bash
cursor-tools doc --from-github husniadil/cursor-tools
```

### 4. `github` Command

Accesses information from GitHub (pull requests and issues).

**Subcommands:**

-   `pr`: Pull requests.
    **Usage**:

    ```bash
    cursor-tools github pr
    ```
-   `issue`: Issues.
    **Usage**:

    ```bash
    cursor-tools github issue
    ```

**Options:**

-   `--fromGithub`: GitHub `username/reponame`.
-   `--repo`: GitHub `username/reponame` (alternative to `--fromGithub`).

### 5. `browser` command

Provides web automation capabilities via Playwright. Requires separate installation:

```bash
npm install playwright
```

**Subcommands:**

-   `open`: Opens a URL and captures page content.
    **Usage**:

    ```bash
    cursor-tools browser open "https://example.com" --html
    ```
-   `element`: Inspects a specific element on the page.
    **Usage**:

    ```bash
    cursor-tools browser element --url "https://example.com" --selector "#product-title" --text
    ```

### 6. `install` Command

Installs `cursor-tools` and configures API keys and `.cursorrules`.

**Usage:**

```bash
npx cursor-tools@latest install .
```

## GitHub Authentication

The `github` command supports these authentication methods:

1.  `GITHUB_TOKEN` environment variable.
2.  GitHub CLI (`gh`).
3.  Git Credentials.

Unauthenticated access has lower rate limits.

## Dependencies

-   Node.js 18 or later
-   Perplexity API key
-   Google Gemini API key
-   `dotenv`
-   `eventsource-client`
-   `repomix`
-   `playwright` (peer dependency)

## Advanced Usage Examples

-   Combine commands for complex tasks.
-   Use hints for iterative refinement.
-   Automate documentation updates.
-   Integrate with GitHub Actions for documentation workflows.

--- End of Documentation ---
```

--- End of Documentation ---
