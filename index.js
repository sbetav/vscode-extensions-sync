#!/usr/bin/env node

import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import ora from "ora";
import chalk from "chalk";
import updateNotifier from "update-notifier";
import {
  EDITORS,
  EXTENSION_MODES,
  SNIPPET_MODES,
  SYNC_ITEMS,
} from "./lib/constants.js";
import { isEditorInstalled } from "./lib/editor-cli.js";
import { exportExtensions, syncExtensions } from "./lib/extensions-sync.js";
import {
  getSettingsPath,
  getSnippetsPath,
  getKeybindingsPath,
} from "./lib/profile-paths.js";
import { readSourceSettings, syncSettings } from "./lib/settings-sync.js";
import { syncSnippets } from "./lib/snippets-sync.js";
import {
  readSourceKeybindings,
  syncKeybindings,
} from "./lib/keybindings-sync.js";
import {
  promptExtensionMode,
  promptSnippetMode,
  promptSourceEditor,
  promptSyncItems,
  promptTargetEditors,
} from "./lib/prompts.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf-8"));

const notifier = updateNotifier({ pkg });
notifier.notify();

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
  ${pkg.name} v${pkg.version}
  ${pkg.description}

  Usage: ${Object.keys(pkg.bin)[0]} [options]

  Options:
    -h, --help      Show this help message
    -v, --version   Show version number
`);
    return;
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log(pkg.version);
    return;
  }

  console.log("\n  Editor profile sync\n");

  const detectSpinner = ora({
    text: "Detecting installed editors...",
    color: "cyan",
  }).start();

  const availableEditors = EDITORS.filter((editor) =>
    isEditorInstalled(editor),
  );

  if (availableEditors.length === 0) {
    detectSpinner.fail("No supported editors found.");
    if (process.platform === "darwin") {
      console.log(
        chalk.yellow(
          "\n  On macOS, you have two options:\n" +
            "  1. Install terminal command (recommended):\n" +
            "     • Open your editor\n" +
            "     • Press Cmd + Shift + P\n" +
            "     • Type: shell command\n" +
            "     • Select: Shell Command: Install '[command]' command in PATH\n" +
            "     • Restart your terminal\n" +
            "  2. Or make sure the editor is installed in /Applications/[EditorName].app\n",
        ),
      );
    } else {
      console.log(
        chalk.yellow(
          "\n  Install at least one supported editor and make sure its CLI is on your PATH.\n",
        ),
      );
    }
    process.exit(1);
  }

  detectSpinner.succeed(
    `Found ${availableEditors.length} editor${availableEditors.length === 1 ? "" : "s"}: ${availableEditors
      .map((e) => e.name)
      .join(", ")}`,
  );
  console.log("");

  const sourceId = await promptSourceEditor(availableEditors);
  const sourceEditor = availableEditors.find((e) => e.id === sourceId);

  const syncItems = await promptSyncItems(SYNC_ITEMS, chalk);

  let extensionMode = "additive";
  if (syncItems.includes("extensions")) {
    extensionMode = await promptExtensionMode(EXTENSION_MODES);
  }

  let snippetMode = "merge";
  if (syncItems.includes("snippets")) {
    snippetMode = await promptSnippetMode(SNIPPET_MODES);
  }

  const targetChoices = availableEditors
    .filter((e) => e.id !== sourceId)
    .map((e) => ({ name: e.name, value: e.id }));

  if (targetChoices.length === 0) {
    console.log(
      chalk.yellow("\n  No other installed editors found to sync to.\n"),
    );
    process.exit(1);
  }

  const targetIds = await promptTargetEditors(targetChoices, chalk);
  const targetEditors = availableEditors.filter((e) =>
    targetIds.includes(e.id),
  );

  let desiredExtensions = [];
  if (syncItems.includes("extensions")) {
    const exportSpinner = ora({
      text: `Exporting extensions from ${sourceEditor.name}...`,
      color: "cyan",
    }).start();
    try {
      desiredExtensions = await exportExtensions(sourceEditor);
      exportSpinner.succeed(`${desiredExtensions.length} extensions detected`);
    } catch (err) {
      exportSpinner.fail("Extension export failed");
      console.error("  Error:", err.message, "\n");
      process.exit(1);
    }
  }

  let sourceSettings = {};
  if (syncItems.includes("settings")) {
    try {
      sourceSettings = readSourceSettings(getSettingsPath(sourceEditor));
    } catch (err) {
      console.error(`  ${err.message}\n`);
      process.exit(1);
    }
  }

  let sourceSnippetsDir = "";
  if (syncItems.includes("snippets")) {
    sourceSnippetsDir = getSnippetsPath(sourceEditor);
    if (!existsSync(sourceSnippetsDir)) {
      console.error(
        `  Source snippets folder not found: ${sourceSnippetsDir}\n`,
      );
      process.exit(1);
    }
  }

  let sourceKeybindings = [];
  if (syncItems.includes("keybindings")) {
    try {
      sourceKeybindings = readSourceKeybindings(
        getKeybindingsPath(sourceEditor),
      );
    } catch (err) {
      console.error(`  ${err.message}\n`);
      process.exit(1);
    }
  }

  console.log("");

  for (const editor of targetEditors) {
    try {
      console.log(chalk.bold(editor.name) + ":");

      if (syncItems.includes("settings")) {
        const spinner = ora({
          text: "Syncing settings.json...",
          color: "cyan",
        }).start();
        try {
          const targetPath = getSettingsPath(editor, { createIfMissing: true });
          const merged = syncSettings(sourceSettings, targetPath);
          spinner.succeed(
            `settings.json synced (${Object.keys(merged).length} keys)`,
          );
        } catch (err) {
          spinner.fail(`settings sync failed (${err.message})`);
        }
      }

      if (syncItems.includes("snippets")) {
        const spinner = ora({
          text: `Syncing snippets (${snippetMode} mode)...`,
          color: "cyan",
        }).start();
        try {
          const targetSnippetsDir = getSnippetsPath(editor, {
            createIfMissing: true,
          });
          const fileCount = syncSnippets(
            sourceSnippetsDir,
            targetSnippetsDir,
            snippetMode,
          );
          spinner.succeed(
            `snippets synced (${fileCount} file${fileCount === 1 ? "" : "s"}, ${snippetMode} mode)`,
          );
        } catch (err) {
          spinner.fail(`snippets sync failed (${err.message})`);
        }
      }

      if (syncItems.includes("keybindings")) {
        const spinner = ora({
          text: "Syncing keybindings.json...",
          color: "cyan",
        }).start();
        try {
          const targetPath = getKeybindingsPath(editor, {
            createIfMissing: true,
          });
          const merged = syncKeybindings(sourceKeybindings, targetPath);
          spinner.succeed(
            `keybindings.json synced (${merged.length} binding${merged.length === 1 ? "" : "s"})`,
          );
        } catch (err) {
          spinner.fail(`keybindings sync failed (${err.message})`);
        }
      }

      if (syncItems.includes("extensions")) {
        const spinner = ora({
          text: "Installing extensions...",
          color: "cyan",
        }).start();
        const result = await syncExtensions(
          editor,
          desiredExtensions,
          extensionMode,
          (i, extensionId) => {
            spinner.text = `Installing extensions [${i + 1}/${desiredExtensions.length}] ${chalk.dim(extensionId)}`;
          },
        );
        const successPart = chalk.green(`${result.synced} installed`);
        const failedPart =
          result.failed.length > 0
            ? `, ${chalk.red(`${result.failed.length} failed`)}`
            : "";
        spinner.succeed(`extensions synced (${successPart}${failedPart})`);
        if (result.failed.length > 0) {
          console.log(`${chalk.red("Failed:")} ${result.failed.join(", ")}`);
        }
      }

      console.log("");
    } catch (err) {
      console.log("  ", editor.name, "error:", err.message, "\n");
    }
  }

  console.log(chalk.green("✔ Sync complete.\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
