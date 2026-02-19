import { select, checkbox } from "@inquirer/prompts";

export async function promptSourceEditor(availableEditors) {
  return await select({
    message: "Share from:",
    choices: availableEditors.map((e) => ({ name: e.name, value: e.id })),
    pageSize: 10,
  });
}

export async function promptSyncItems(syncItems, chalk) {
  return await checkbox({
    message: "Select items to sync:",
    choices: syncItems,
    required: true,
    validate: (v) => (v.length ? true : "Select at least one item."),
  });
}

export async function promptExtensionMode(extensionModes) {
  return await select({
    message: "Extension mode:",
    choices: extensionModes.map((m) => ({
      name: m.name,
      value: m.value,
      short: m.short,
    })),
    default: "additive",
  });
}

export async function promptSnippetMode(snippetModes) {
  return await select({
    message: "Snippet mode:",
    choices: snippetModes.map((m) => ({
      name: m.name,
      value: m.value,
      short: m.short,
    })),
    default: "merge",
  });
}

export async function promptTargetEditors(targetChoices, chalk) {
  return await checkbox({
    message: "Select target editors:",
    choices: targetChoices,
    required: true,
    validate: (v) => (v.length ? true : "Select at least one editor."),
  });
}
