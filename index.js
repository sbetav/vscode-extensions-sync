#!/usr/bin/env node

/**
 * Cross-platform extension export & sync for VS Code–based editors.
 * Single command: choose source editor → target editors → mode → run.
 */

import { execSync, spawn } from "child_process";
import { writeFileSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import inquirer from "inquirer";
import CheckboxPrompt from "inquirer/lib/prompts/checkbox.js";
import ora from "ora";
import chalk from "chalk";

// Custom checkbox prompt that hides the default instructions
class CleanCheckboxPrompt extends CheckboxPrompt {
  constructor(questions, rl, answers) {
    super(questions, rl, answers);
    this.dontShowHints = true;
  }
}
inquirer.registerPrompt("clean-checkbox", CleanCheckboxPrompt);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf-8"));

// Editors supported (same CLI API: --list-extensions, --install-extension, --uninstall-extension)
// Sorted alphabetically by display name
const EDITORS = [
  { id: "antigravity", name: "Antigravity", cmd: "antigravity" },
  { id: "cursor", name: "Cursor", cmd: "cursor" },
  { id: "kiro", name: "Kiro", cmd: "kiro" },
  { id: "trae", name: "Trae", cmd: "trae" },
  { id: "code", name: "VS Code", cmd: "code" },
  { id: "windsurf", name: "Windsurf", cmd: "windsurf" },
];

const EXTENSIONS_FILE = "extensions.txt";

const MODES = [
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

function runEditorCmd(editor, args, options = {}) {
  const {
    encoding = "utf-8",
    ignoreError = false,
    quietStderr = false,
  } = options;
  const cmd = [editor.cmd, ...args].join(" ");
  const stdio = quietStderr ? ["inherit", "pipe", "pipe"] : undefined;
  try {
    return execSync(cmd, {
      encoding,
      maxBuffer: 10 * 1024 * 1024,
      ...(stdio && { stdio }),
    });
  } catch (err) {
    if (ignoreError) return null;
    throw err;
  }
}

function getInstalledExtensions(editor) {
  const out = runEditorCmd(editor, ["--list-extensions"], {
    ignoreError: true,
  });
  if (out == null) return null;
  return out
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function getInstalledExtensionsAsync(editor) {
  const out = await runEditorCmdAsync(editor, ["--list-extensions"], {
    ignoreError: true,
  });
  if (out == null) return null;
  return out
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function exportExtensions(editor, filePath) {
  const list = getInstalledExtensions(editor);
  if (list == null) throw new Error(`${editor.name} CLI not found or failed.`);
  const sorted = [...list].sort();
  writeFileSync(
    filePath,
    sorted.join("\n") + (sorted.length ? "\n" : ""),
    "utf-8",
  );
  return sorted.length;
}

async function exportExtensionsAsync(editor, filePath) {
  const list = await getInstalledExtensionsAsync(editor);
  if (list == null) throw new Error(`${editor.name} CLI not found or failed.`);
  const sorted = [...list].sort();
  writeFileSync(
    filePath,
    sorted.join("\n") + (sorted.length ? "\n" : ""),
    "utf-8",
  );
  return sorted.length;
}

/** Escape one arg for safe use in shell command string. */
function escapeShellArg(a) {
  const s = String(a);
  return s.includes(" ") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Async run so the event loop can tick (spinner can animate). Always captures stdout/stderr. */
function runEditorCmdAsync(editor, args, options = {}) {
  const { ignoreError = false } = options;
  const cmdString = [editor.cmd, ...args.map(escapeShellArg)].join(" ");
  return new Promise((resolve, reject) => {
    const child = spawn(cmdString, [], {
      shell: true,
      stdio: ["inherit", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    if (child.stdout)
      child.stdout.on("data", (d) => {
        stdout += d.toString();
      });
    if (child.stderr)
      child.stderr.on("data", (d) => {
        stderr += d.toString();
      });
    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else if (ignoreError) resolve(null);
      else reject(new Error(stderr || `Exit ${code}`));
    });
    child.on("error", (err) => reject(err));
  });
}

function installExtension(editor, extId) {
  const result = runEditorCmd(editor, ["--install-extension", extId], {
    ignoreError: true,
    quietStderr: true,
  });
  return result !== null;
}

async function installExtensionAsync(editor, extId) {
  const result = await runEditorCmdAsync(
    editor,
    ["--install-extension", extId],
    {
      ignoreError: true,
    },
  );
  return result !== null;
}

function uninstallExtension(editor, extId) {
  runEditorCmd(editor, ["--uninstall-extension", extId], { ignoreError: true });
}

function getExtensionsList(filePath) {
  const content = readFileSync(filePath, "utf-8");
  return content
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Check if an editor CLI is available on PATH. */
function isEditorInstalled(editor) {
  const cmd = process.platform === "win32" ? "where" : "which";
  try {
    execSync(`${cmd} ${editor.cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
  ${pkg.name} v${pkg.version}
  ${pkg.description}

  Usage: vscode-extensions-sync [options]

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

  const cwd = process.cwd();
  const extPath = join(cwd, EXTENSIONS_FILE);

  console.log("\n  Extension export & sync\n");

  // Detect which editors are installed
  const detectSpinner = ora({
    text: "Detecting installed editors...",
    color: "cyan",
  }).start();

  const availableEditors = EDITORS.filter((e) => isEditorInstalled(e));

  if (availableEditors.length === 0) {
    detectSpinner.fail("No supported editors found on PATH.");
    console.log(
      chalk.yellow(
        "\n  Install at least one supported editor and make sure its CLI is on your PATH.\n",
      ),
    );
    process.exit(1);
  }

  const detected = availableEditors.map((e) => e.name).join(", ");
  detectSpinner.succeed(
    `Found ${availableEditors.length} editor(s): ${detected}`,
  );
  console.log("");

  const { sourceId } = await inquirer.prompt([
    {
      type: "list",
      name: "sourceId",
      message: "Export extensions from:",
      choices: availableEditors.map((e) => ({ name: e.name, value: e.id })),
      pageSize: 10,
    },
  ]);

  const sourceEditor = availableEditors.find((e) => e.id === sourceId);
  const targetChoices = availableEditors
    .filter((e) => e.id !== sourceId)
    .map((e) => ({
      name: e.name,
      value: e.id,
    }));

  let targetIds = [];
  let mode = "additive";

  if (targetChoices.length > 0) {
    const targetAnswer = await inquirer.prompt([
      {
        type: "clean-checkbox",
        message: `Sync to: ${chalk.dim("(Press <space> to select, <a> to toggle all, <enter> to continue)")}`,
        name: "targetIds",
        choices: targetChoices,
        validate: (v) => (v.length ? true : "Select at least one editor."),
      },
    ]);
    targetIds = targetAnswer.targetIds;

    const modeAnswer = await inquirer.prompt([
      {
        type: "list",
        name: "mode",
        message: "Mode:",
        choices: MODES.map((m) => ({
          name: m.name,
          value: m.value,
          short: m.short,
        })),
        default: "additive",
      },
    ]);
    mode = modeAnswer.mode;
  } else {
    console.log("  No other editors to sync to. Export only.\n");
  }

  const exportSpinner = ora({
    text: `Exporting extensions from ${sourceEditor.name}...`,
    color: "cyan",
  }).start();
  let count;
  try {
    count = await exportExtensionsAsync(sourceEditor, extPath);
    exportSpinner.succeed(`Exported ${count} extensions to ${EXTENSIONS_FILE}`);
    console.log("");
  } catch (err) {
    exportSpinner.fail("Export failed");
    console.error("  Error:", err.message, "\n");
    process.exit(1);
  }

  if (targetIds.length === 0) return;

  const desired = getExtensionsList(extPath);
  const targetEditors = availableEditors.filter((e) =>
    targetIds.includes(e.id),
  );

  for (const editor of targetEditors) {
    try {
      const current = await getInstalledExtensionsAsync(editor);

      if (mode === "strict") {
        const toRemove = current.filter((id) => !desired.includes(id));
        for (const id of toRemove) {
          console.log("    Removing", id);
          uninstallExtension(editor, id);
        }
      }

      let synced = 0;
      const failed = [];
      const spinner = ora({
        text: `${chalk.bold(editor.name)}: Installing extensions...`,
        color: "cyan",
      }).start();

      for (let i = 0; i < desired.length; i++) {
        const id = desired[i];
        spinner.text = `${chalk.bold(editor.name)}: [${i + 1}/${desired.length}] Installing ${id}`;
        const ok = await installExtensionAsync(editor, id);
        if (ok) synced++;
        else failed.push(id);
      }

      const parts = [chalk.green(`${synced} synced`)];
      if (failed.length > 0) parts.push(chalk.red(`${failed.length} failed`));
      spinner.succeed(`${chalk.bold(editor.name)}: ${parts.join(", ")}`);
      if (failed.length > 0) {
        console.log(`      ${chalk.red("Failed:")} ${failed.join(", ")}`);
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
