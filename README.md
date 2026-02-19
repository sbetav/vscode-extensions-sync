# editor-profile-sync

Cross-platform CLI to share your VS Code-based editor profile between editors.

[GitHub](https://github.com/sbetav/editor-profile-sync) · [npm](https://www.npmjs.com/package/editor-profile-sync)

You can sync:

- extensions
- snippets
- `settings.json`

## Requirements

- **Node.js** 18 or newer
- **npm** (comes with Node.js)
- At least one [supported editor](#supported-editors) installed
  - **macOS**: Choose one of the following options:
    - **Option 1 (Recommended)**: Install terminal command:
      1. Open your editor
      2. Press `Cmd + Shift + P` to open the Command Palette
      3. Type: `shell command`
      4. Select: **Shell Command: Install '[command]' command in PATH**
      5. Restart your terminal
    - **Option 2**: Have the editor installed in `/Applications/` (e.g., `/Applications/Visual Studio Code.app`). The CLI will be auto-detected from the app bundle.
  - **Windows/Linux**: Editor CLI must be on your PATH (e.g., `code`, `cursor`)

## Install

### Via npx (recommended)

Run directly without installing:

```bash
npx editor-profile-sync
```

### Global install

Install once, then run from anywhere:

```bash
npm install -g editor-profile-sync
editor-profile-sync
```

### From source

Clone this repo, then install dependencies:

```bash
npm install
```

## Usage

### CLI options

| Option            | Description         |
| ----------------- | ------------------- |
| `-h`, `--help`    | Show help message   |
| `-v`, `--version` | Show version number |

## How it works

1. Detect installed editors (only editors with CLI on PATH are shown).
2. Choose a source editor.
3. Choose what to share:
   - `Extensions`
   - `settings.json`
   - `Snippets`
4. Choose mode(s) for selected item types:
   - Extensions:
     - Install on top of existing (additive)
     - Exact sync (replace all extensions)
   - Snippets:
     - Merge (source snippets override key conflicts in matching snippet files)
     - Replace (target snippets folder is replaced)
5. Choose one or more target editors.
6. Run sync.

### Settings merge behavior

For `settings.json`, each target is merged as:

```js
const merged = {
  ...targetSettings,
  ...sourceSettings,
};
```

What this means:

- Shared/source settings win on key conflicts.
- Existing unrelated target settings stay.
- Editor-specific keys are preserved unless your source uses the same key.

Example:

Target:

```json
{
  "terminal.integrated.fontSize": 14
}
```

Source:

```json
{
  "editor.formatOnSave": true
}
```

Result:

```json
{
  "terminal.integrated.fontSize": 14,
  "editor.formatOnSave": true
}
```

## Supported editors

These editors are currently supported:

| Editor      | CLI command   |
| ----------- | ------------- |
| Antigravity | `antigravity` |
| Cursor      | `cursor`      |
| Kiro        | `kiro`        |
| Trae        | `trae`        |
| VS Code     | `code`        |
| Windsurf    | `windsurf`    |

**macOS**: Editors work with either option: install terminal command (recommended) or auto-detect from `/Applications/` if installed as `.app` bundles.

**Windows/Linux**: Each editor must be installed and its CLI available in your terminal (e.g. `code`, `cursor`).

## Generated files

- `extensions.txt` is created when syncing extensions and contains the exported source extension IDs.

## License

MIT
