import inquirer from "inquirer";
import CheckboxPrompt from "inquirer/lib/prompts/checkbox.js";

class CleanCheckboxPrompt extends CheckboxPrompt {
  constructor(questions, rl, answers) {
    super(questions, rl, answers);
    this.dontShowHints = true;
  }
}

let isRegistered = false;

function ensurePromptRegistered() {
  if (isRegistered) return;
  inquirer.registerPrompt("clean-checkbox", CleanCheckboxPrompt);
  isRegistered = true;
}

const CHECKBOX_HINT =
  "(Press <space> to select, <a> to toggle all, <enter> to continue)";

export async function promptSourceEditor(availableEditors) {
  ensurePromptRegistered();
  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "sourceId",
      message: "Share from:",
      choices: availableEditors.map((e) => ({ name: e.name, value: e.id })),
      pageSize: 10,
    },
  ]);
  return answer.sourceId;
}

export async function promptSyncItems(syncItems, chalk) {
  ensurePromptRegistered();
  const answer = await inquirer.prompt([
    {
      type: "clean-checkbox",
      name: "selectedItems",
      message: `Share: ${chalk.dim(CHECKBOX_HINT)}`,
      choices: syncItems,
      validate: (v) => (v.length ? true : "Select at least one item."),
    },
  ]);
  return answer.selectedItems;
}

export async function promptExtensionMode(extensionModes) {
  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "extensionMode",
      message: "Extension mode:",
      choices: extensionModes.map((m) => ({
        name: m.name,
        value: m.value,
        short: m.short,
      })),
      default: "additive",
    },
  ]);
  return answer.extensionMode;
}

export async function promptSnippetMode(snippetModes) {
  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "snippetMode",
      message: "Snippet mode:",
      choices: snippetModes.map((m) => ({
        name: m.name,
        value: m.value,
        short: m.short,
      })),
      default: "merge",
    },
  ]);
  return answer.snippetMode;
}

export async function promptTargetEditors(targetChoices, chalk) {
  ensurePromptRegistered();
  const answer = await inquirer.prompt([
    {
      type: "clean-checkbox",
      name: "targetIds",
      message: `Sync to: ${chalk.dim(CHECKBOX_HINT)}`,
      choices: targetChoices,
      validate: (v) => (v.length ? true : "Select at least one editor."),
    },
  ]);
  return answer.targetIds;
}
