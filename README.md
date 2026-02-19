# vscode-extensions-sync

**Cross-platform** (Windows & macOS) CLI to **export** your extensions from one VS Code–based editor and **sync** them to others. Backup Cursor extensions to VS Code, mirror VS Code to Windsurf, or keep Kiro, Trae, and Antigravity in sync—all with one interactive command.

## Requirements

- **Node.js** 18 or newer
- **npm** (comes with Node.js)
- At least one [supported editor](#supported-editors) installed, with its CLI on your PATH (e.g. `code`, `cursor`)

## Install

Clone this repo, then install dependencies:

```bash
npm install
```

## Usage

From the project folder:

```bash
npm start
```

or:

```bash
node index.js
```

After linking (`npm link` in this folder), run from anywhere:

```bash
vscode-extensions-sync
```

### Options

| Option            | Description         |
| ----------------- | ------------------- |
| `-h`, `--help`    | Show help message   |
| `-v`, `--version` | Show version number |

## How it works

1. **Detect editors** – The script checks your PATH and lists only **supported editors that are installed**. If none are found, it exits with instructions.
2. **Export from** – Choose which editor to export extensions from (arrow keys + Enter).
3. **Sync to** – Choose which editors to sync to (multi-select: **Space** to toggle, **A** to toggle all, **Enter** to continue).
4. **Mode**
   - **Install extensions on top of existing (Recommended)** – Installs or updates extensions from the list; leaves other extensions unchanged.
   - **Exact sync (Replace all extensions)** – Uninstalls extensions not in the list, then installs the full list so the target matches the source.
5. **Export** – Extensions are written to `extensions.txt` in the current directory.
6. **Sync** – Each selected editor gets the extensions installed (and in exact-sync mode, extras are uninstalled). You’ll see a per-editor summary: how many synced and how many failed (e.g. extensions not available in that editor’s marketplace).

Editors whose CLI is not on PATH are skipped during sync with a message.

## Supported editors

These VS Code–based editors are supported (only those detected on your PATH appear in the prompts):

| Editor      | CLI command   |
| ----------- | ------------- |
| Antigravity | `antigravity` |
| Cursor      | `cursor`      |
| Kiro        | `kiro`        |
| Trae        | `trae`        |
| VS Code     | `code`        |
| Windsurf    | `windsurf`    |

Each editor must be installed and available in your terminal (e.g. `code`, `cursor`).

## Generated file

- **`extensions.txt`** – List of extension IDs (one per line) exported from the source editor. Used as the source of truth for sync. Ignored by git in this repo.

## License

MIT
