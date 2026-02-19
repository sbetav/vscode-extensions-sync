# editor-profile-sync

Cross-platform CLI to share your VS Code-based editor profile between editors.

You can sync:

- extensions
- snippets
- `settings.json`

## Requirements

- **Node.js** 18 or newer
- **npm** (comes with Node.js)
- At least one [supported editor](#supported-editors) installed, with its CLI on your PATH (e.g. `code`, `cursor`)

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

Each editor must be installed and available in your terminal (e.g. `code`, `cursor`).

## Generated files

- `extensions.txt` is created when syncing extensions and contains the exported source extension IDs.

## License

MIT
