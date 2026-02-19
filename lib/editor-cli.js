import { execSync, spawn } from "child_process";

export function isEditorInstalled(editor) {
  const cmd = process.platform === "win32" ? "where" : "which";
  try {
    execSync(`${cmd} ${editor.cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function escapeShellArg(arg) {
  const s = String(arg);
  return s.includes(" ") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
}

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
  const cmd = [editor.cmd, "--uninstall-extension", extensionId].join(" ");
  execSync(cmd, { stdio: "ignore" });
}
