
--- Repository Documentation ---

```markdown
--- Repository Documentation ---

# Cursor Tools Documentation

## Repository Purpose and Summary

`cursor-tools` enhances AI development agents and IDEs like Cursor. It provides AI-powered web queries and codebase understanding. It integrates with Perplexity AI for web searches and Google Gemini for repository-aware assistance. It is an npm package with a CLI.

## Quick Start

1. **Installation:**
   Run `npx cursor-tools@latest install .` in your project root.
   This installs `cursor-tools`, configures API keys, and updates `.cursorrules`.

2. **Basic Usage:**
   - **Web Search:** `cursor-tools web "Your question here"`
   - **Repository Context:** `cursor-tools repo "Your question about the codebase"`

## Configuration

### API Keys

`cursor-tools` requires API keys for Perplexity AI and Google Gemini.

- **Interactive Setup:** Use `cursor-tools install` to set up keys.
- **Manual Setup:** Create `.cursor-tools.env` in your project root or `~/.cursor-tools/.env` in your home directory.

   ```env
   OPENROUTER_API_KEY="your-perplexity-api-key"
   ```

### Default Settings

Customize settings in `cursor-tools.config.json` in your project root or `~/.cursor-tools/config.json` in your home directory.

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
  }
}
```

## Core Features / API / Interfaces

### 1. `web` Command

Performs web searches using Perplexity AI.

**Usage:**

```bash
cursor-tools web "What is the latest version of React?"
cursor-tools web --model perplexity/sonar "Explain quantum computing"
cursor-tools web "How do I use fetch in JavaScript?" --max-tokens 500 --save-to output.txt
```

**Options:**

- `--model`: Perplexity model name.
- `--maxTokens`: Maximum tokens in response.
- `--saveTo`: Path to save output.
- `--hint`: Additional context for AI.

### 2. `repo` Command

Provides context-aware answers about the current repository using Google Gemini.

**Usage:**

```bash
cursor-tools repo "Explain the purpose of the src/config.ts file"
cursor-tools repo "How does authentication work in this project?" --model gemini-pro
cursor-tools repo "List all public functions in src/commands/index.ts" --save-to functions.txt
```

**Options:**

- `--model`: Gemini model name.
- `--maxTokens`: Maximum tokens in response.
- `--saveTo`: Path to save output.
- `--hint`: Additional context for AI.

### 3. `doc` Command

Generates documentation for a repository.

**Usage:**

```bash
cursor-tools doc # Documents local repository to stdout
cursor-tools doc --output docs.md # Documents local repo, saves to docs.md
cursor-tools doc --from-github husniadil/cursor-tools # Documents remote GitHub repo to stdout
cursor-tools doc --from-github husniadil/cursor-tools@main --output cursor-tools-docs.md # Remote repo, branch and output file.
cursor-tools doc --hint "Focus on the public API" --output api-docs.md # With hint
```

**Options:**

- `--output`: Output file path.
- `--fromGithub`: GitHub URL or `username/reponame[@branch]`.
- `--model`: Gemini model name.
- `--maxTokens`: Maximum tokens in response.
- `--hint`: Additional context for AI.

### 4. `github` Command

Accesses information from GitHub (pull requests and issues).

**Subcommands:**

- `pr`: Pull requests.
   **Usage**:
    ```bash
    cursor-tools github pr # Lists recent PRs.
    cursor-tools github pr 123 # Shows details for PR #123.
    cursor-tools github pr --from-github owner/repo # Lists PRs from remote repository.
    cursor-tools github pr 123 --from-github owner/repo # Shows details of remote PR #123.
    ```
- `issue`: Issues.
   **Usage**:
    ```bash
    cursor-tools github issue # Lists recent issues.
    cursor-tools github issue 456 # Shows details for Issue #456.
    cursor-tools github issue --from-github owner/repo # Lists issues from remote repository.
    cursor-tools github issue 456 --from-github owner/repo # Shows details of remote issue #456.
    ```

**Options:**

- `--fromGithub`: GitHub `username/reponame`.
- `--repo`: GitHub `username/reponame` (alternative to `--fromGithub`).
- `--model`: Gemini model name.
- `--maxTokens`: Maximum tokens in response.
- `--hint`: Additional context for AI.

### 5. `install` Command

Installs `cursor-tools` and configures API keys and `.cursorrules`.

**Usage:**

```bash
npx cursor-tools@latest install .
```

**Options:**

- `--packageManager`: Package manager (`npm`, `yarn`, `pnpm`).

## GitHub Authentication

The `github` command supports these authentication methods:

1. `GITHUB_TOKEN` environment variable.
2. GitHub CLI (`gh`) - if installed and logged in.
3. Git Credentials - if authenticated with GitHub via HTTPS.

Unauthenticated access has lower rate limits.

## Dependencies

- Node.js 18 or later
- Perplexity API key
- Google Gemini API key
- `dotenv`
- `eventsource-client`
- `repomix`

## Advanced Usage Examples

- Combine commands for complex tasks.
- Use hints for iterative refinement.
- Automate documentation updates.
- Integrate with GitHub Actions for documentation workflows.

--- End of Documentation ---
```

--- End of Documentation ---
