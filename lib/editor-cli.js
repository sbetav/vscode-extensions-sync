import { execSync, spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

// macOS app bundle names for each editor
const MACOS_APP_BUNDLES = {
  antigravity: "Antigravity.app",
  cursor: "Cursor.app",
  kiro: "Kiro.app",
  trae: "Trae.app",
  code: "Visual Studio Code.app",
  windsurf: "Windsurf.app",
};

function findMacOSCliPath(editor) {
  if (process.platform !== "darwin") return null;

  const appName = MACOS_APP_BUNDLES[editor.id];
  if (!appName) return null;

  const appPath = join("/Applications", appName);
  if (!existsSync(appPath)) return null;

  // VS Code-based editors typically have CLI at:
  // /Applications/AppName.app/Contents/Resources/app/bin/command
  const cliPath = join(
    appPath,
    "Contents",
    "Resources",
    "app",
    "bin",
    editor.cmd,
  );

  if (existsSync(cliPath)) {
    return cliPath;
  }

  return null;
}

export function isEditorInstalled(editor) {
  // First check PATH
  const cmd = process.platform === "win32" ? "where" : "which";
  try {
    execSync(`${cmd} ${editor.cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    // On macOS, also check app bundles
    if (process.platform === "darwin") {
      return findMacOSCliPath(editor) !== null;
    }
    return false;
  }
}

export function getEditorCliPath(editor) {
  // First check PATH
  const cmd = process.platform === "win32" ? "where" : "which";
  try {
    const result = execSync(`${cmd} ${editor.cmd}`, { encoding: "utf-8" });
    const path = result.trim().split("\n")[0];
    if (path) return path;
  } catch {
    // Fall through to fallback options
  }

  // On macOS, fall back to app bundle path
  if (process.platform === "darwin") {
    const macPath = findMacOSCliPath(editor);
    if (macPath) return macPath;
  }

  // Final fallback: use command name (should work if in PATH)
  return editor.cmd;
}

function escapeShellArg(arg) {
  const s = String(arg);
  return s.includes(" ") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
}

function runEditorCmdAsync(editor, args, options = {}) {
  const { ignoreError = false } = options;
  const cliPath = getEditorCliPath(editor);
  const cmdString = [escapeShellArg(cliPath), ...args.map(escapeShellArg)].join(
    " ",
  );

  return new Promise((resolve, reject) => {
    const child = spawn(cmdString, [], {
      shell: true,
      stdio: ["inherit", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    if (child.stdout) {
      child.stdout.on("data", (d) => {
        stdout += d.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on("data", (d) => {
        stderr += d.toString();
      });
    }

    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else if (ignoreError) resolve(null);
      else reject(new Error(stderr || `Exit ${code}`));
    });

    child.on("error", (err) => reject(err));
  });
}

export async function getInstalledExtensions(editor) {
  const out = await runEditorCmdAsync(editor, ["--list-extensions"], {
    ignoreError: true,
  });
  if (out == null) return null;
  return out
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function installExtension(editor, extensionId) {
  const out = await runEditorCmdAsync(
    editor,
    ["--install-extension", extensionId],
    {
      ignoreError: true,
    },
  );
  return out !== null;
}

export function uninstallExtension(editor, extensionId) {
  const cliPath = getEditorCliPath(editor);
  const cmd = [
    escapeShellArg(cliPath),
    "--uninstall-extension",
    escapeShellArg(extensionId),
  ].join(" ");
  execSync(cmd, { stdio: "ignore" });
}
