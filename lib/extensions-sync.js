import { readFileSync, writeFileSync } from "fs";
import {
  getInstalledExtensions,
  installExtension,
  uninstallExtension,
} from "./editor-cli.js";

export async function exportExtensions(sourceEditor, filePath) {
  const list = await getInstalledExtensions(sourceEditor);
  if (list == null) {
    throw new Error(`${sourceEditor.name} CLI not found or failed.`);
  }

  const sorted = [...list].sort();
  writeFileSync(
    filePath,
    sorted.join("\n") + (sorted.length ? "\n" : ""),
    "utf-8",
  );

  return sorted;
}

export function readExtensionsFile(filePath) {
  const content = readFileSync(filePath, "utf-8");
  return content
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function syncExtensions(editor, desired, mode, onProgress) {
  const current = await getInstalledExtensions(editor);
  if (current == null) {
    throw new Error(`${editor.name} CLI not found or failed.`);
  }

  if (mode === "strict") {
    const toRemove = current.filter((id) => !desired.includes(id));
    for (const extensionId of toRemove) {
      try {
        uninstallExtension(editor, extensionId);
      } catch {
        // Keep going; failures are naturally reflected when reinstalling.
      }
    }
  }

  let synced = 0;
  const failed = [];

  for (let i = 0; i < desired.length; i++) {
    const extensionId = desired[i];
    if (onProgress) onProgress(i, extensionId);
    const ok = await installExtension(editor, extensionId);
    if (ok) synced++;
    else failed.push(extensionId);
  }

  return { synced, failed };
}
