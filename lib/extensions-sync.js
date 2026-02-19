import {
  getInstalledExtensions,
  installExtension,
  uninstallExtension,
} from "./editor-cli.js";

export async function exportExtensions(sourceEditor) {
  const list = await getInstalledExtensions(sourceEditor);
  if (list == null) {
    throw new Error(`${sourceEditor.name} CLI not found or failed.`);
  }
  return [...list].sort();
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
