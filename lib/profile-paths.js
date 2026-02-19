import { existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { EDITOR_DATA_DIRS, SETTINGS_FILE, SNIPPETS_DIR } from "./constants.js";

function getConfigBaseDir() {
  if (process.platform === "win32") {
    return process.env.APPDATA || join(homedir(), "AppData", "Roaming");
  }
  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Application Support");
  }
  return process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
}

function getEditorUserDir(editor, { createIfMissing = false } = {}) {
  const base = getConfigBaseDir();
  const names = EDITOR_DATA_DIRS[editor.id] || [editor.name];
  const candidates = names.map((name) => join(base, name, "User"));
  const existing = candidates.find((p) => existsSync(p));
  const selected = existing || candidates[0];

  if (createIfMissing) {
    mkdirSync(selected, { recursive: true });
  }

  return selected;
}

export function getSettingsPath(editor, options = {}) {
  return join(getEditorUserDir(editor, options), SETTINGS_FILE);
}

export function getSnippetsPath(editor, options = {}) {
  return join(getEditorUserDir(editor, options), SNIPPETS_DIR);
}
