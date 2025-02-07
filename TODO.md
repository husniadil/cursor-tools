Packing repository using repomix...
Querying Gemini AI using google/gemini-2.0-flash-001...
Okay, adding Playwright browser automation to `cursor-tools` is a fantastic idea! It will significantly enhance its capabilities, especially for web development and debugging scenarios. Here's a detailed plan for implementing browser sub-commands, focusing on a progressive approach:

## Playwright Browser Automation for `cursor-tools`: Feature Plan

**Overall Goal:** To provide a set of `cursor-tools browser` subcommands that allow users to interact with and inspect web pages programmatically, primarily for debugging, information gathering, and basic automation tasks within the context of AI-assisted development.

**Core Dependency:**  Playwright (`playwright` npm package) will be the core library for browser automation.

**Command Structure:** `cursor-tools browser <subcommand> [options]`

**Prioritization - Phased Implementation:**

We will implement the subcommands in phases, starting with the most fundamental and broadly useful ones.

**Phase 1: Essential Inspection and Capture Commands (Implement First)**

These commands form the foundation and directly address the initial request.

1.  **`cursor-tools browser open`**:  Opens a URL in a browser and provides basic page information.

    *   **Description:**  Navigates to a given URL, waits for the page to load, and can return the rendered HTML content, console logs, screenshots, and network activity.
    *   **Options:**
        *   `--url <URL>` (Required): The URL to open.
        *   `--console` / `--no-console`: (Boolean, default: `false`):  If present, outputs the browser console logs to the terminal.
        *   `--html` / `--no-html`: (Boolean, default: `false`): If present, outputs the rendered HTML of the page to the terminal.
        *   `--screenshot <filepath>`: (String, optional): If specified, takes a screenshot and saves it to the given path.
        *   `--network` / `--no-network`: (Boolean, default: `false`): If present, monitor and output network requests.
        *   `--timeout <milliseconds>`: (Number, default: Playwright's default navigation timeout): Navigation timeout in milliseconds.
        *   `--viewport <width>x<height>`: (String, e.g., "1920x1080"): Sets the viewport size for the browser.
        *   `--headless` / `--no-headless`: (Boolean, default: `true`):  Run browser in headless mode (no UI). `--no-headless` to show the browser UI (useful for visual debugging).
        *   `--connect-to <port>`: (Number, optional): Connect to an already running Chrome instance at the specified debugging port (e.g., 9222). Note: Chrome must be launched with --remote-debugging-port=<port>.

    *   **Example Usage:**
        ```bash
        cursor-tools browser open --url "http://localhost:3000" --console --html
        cursor-tools browser open --url "https://example.com" --html --viewport 800x600
        cursor-tools browser open --url "http://localhost:8080" --no-headless
        cursor-tools browser open --url "https://example.com" --screenshot "example.png"
        cursor-tools browser open --url "https://webapp.example.com" --network --console
        cursor-tools browser open --url "https://example.com" --connect-to 9222 --console
        ```

**Phase 2: Enhanced Inspection and Data Extraction (Implement Next)**

These commands build upon Phase 1 to provide more advanced inspection and data retrieval capabilities.

3.  **`cursor-tools browser element`**: Inspects a specific element on the page.

    *   **Description:** Allows users to target a specific element using a CSS selector and retrieve information about it, such as its HTML, text content, or take a screenshot of just that element.
    *   **Options:**
        *   `--url <URL>` (Optional): URL to navigate to before element inspection.
        *   `--selector <CSS selector>` (Required): CSS selector to identify the element.
        *   `--html` / `--no-html`: (Boolean, default: `false`): Output the HTML of the element.
        *   `--text` / `--no-text`: (Boolean, default: `false`): Output the text content of the element.
        *   `--screenshot <filepath>` (String, Optional): Take a screenshot of the element and save it to the specified file.

    *   **Example Usage:**
        ```bash
        cursor-tools browser element --url "https://example.com" --selector "#product-title" --text
        cursor-tools browser element --url "https://example.com" --selector ".main-content" --html --save-to "content.html"
        cursor-tools browser element --url "https://example.com" --selector ".ad-banner" --screenshot "banner.png"
        ```

**Implementation Notes:**

*   **Error Handling:** Robust error handling is crucial. Playwright can throw exceptions if navigation fails, selectors are not found, etc.  Commands should catch these and provide informative error messages.
*   **Dependencies:** Add `playwright` as a dependency to `package.json`.
*   **Command Structure:**  Create a new directory `src/commands/browser/` to house these subcommands (similar to `src/commands/github/`). Create files like `open.ts`, etc., each implementing the `Command` interface.
*   **Argument Parsing:** Keep argument parsing for browser commands self-contained within the browser command implementation, separate from the existing cursor-tools argument parsing system. This maintains isolation and prevents any impact on existing functionality.
*   **Integration with `index.ts`:**  Register the `browser` command in `src/commands/index.ts` and route subcommands appropriately.
*   **Documentation:** Update `README.md` and `docs/cursor-tools.md` with documentation for the new `browser` command and its subcommands, including options and usage examples. Update `.cursorrules` accordingly.
*   **Configuration:**  Consider if any browser-specific configuration is needed (e.g., default browser type, paths, etc.).  For now, probably not necessary; Playwright defaults should be fine.
*   **Concurrency/Context:** Each command execution will create a new browser context and page, keeping the implementation simple and stateless.

**Next Steps:**

1.  **Start with Phase 1: Implement `browser open` command.**  This will give you the core inspection, capture, screenshot, and network monitoring capabilities.
2.  **Test Phase 1 thoroughly.** Write unit tests and integration tests to ensure these commands work as expected and handle errors gracefully.
3.  **Implement Phase 2 command (`element`).**

This phased plan allows you to build browser automation into `cursor-tools` incrementally, focusing on the most essential features for web development and debugging. Let me know if you'd like a more detailed code structure outline or have any other questions!