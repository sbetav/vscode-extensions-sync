export const EXTENSIONS_FILE = "extensions.txt";
export const SETTINGS_FILE = "settings.json";
export const SNIPPETS_DIR = "snippets";

// Sorted alphabetically by display name.
export const EDITORS = [
  { id: "antigravity", name: "Antigravity", cmd: "antigravity" },
  { id: "cursor", name: "Cursor", cmd: "cursor" },
  { id: "kiro", name: "Kiro", cmd: "kiro" },
  { id: "trae", name: "Trae", cmd: "trae" },
  { id: "code", name: "VS Code", cmd: "code" },
  { id: "windsurf", name: "Windsurf", cmd: "windsurf" },
];

export const EXTENSION_MODES = [
  {
    value: "additive",
    name: "Install extensions on top of existing (Recommended)",
    short: "Additive",
  },
  {
    value: "strict",
    name: "Exact sync (Replace all extensions)",
    short: "Strict",
  },
];

export const SNIPPET_MODES = [
  {
    value: "merge",
    name: "Merge snippet files (Recommended)",
    short: "Merge",
  },
  {
    value: "replace",
    name: "Replace all target snippets",
    short: "Replace",
  },
];

export const SYNC_ITEMS = [
  {
    value: "extensions",
    name: "Extensions",
    short: "Extensions",
  },
  {
    value: "settings",
    name: "settings.json",
    short: "settings.json",
  },
  {
    value: "snippets",
    name: "Snippets",
    short: "Snippets",
  },
];

export const EDITOR_DATA_DIRS = {
  antigravity: ["Antigravity"],
  code: ["Code", "Code - OSS"],
  cursor: ["Cursor"],
  kiro: ["Kiro"],
  trae: ["Trae"],
  windsurf: ["Windsurf"],
};
