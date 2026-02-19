import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from "fs";
import { dirname, join } from "path";
import { readJsonObject, writeJsonObject } from "./settings-sync.js";

function listFilesRecursive(dirPath, prefix = "") {
  if (!existsSync(dirPath)) return [];

  const entries = readdirSync(dirPath);
  const files = [];

  for (const entry of entries) {
    const rel = prefix ? join(prefix, entry) : entry;
    const abs = join(dirPath, entry);
    const st = statSync(abs);
    if (st.isDirectory()) {
      files.push(...listFilesRecursive(abs, rel));
    } else if (st.isFile()) {
      files.push(rel);
    }
  }

  return files;
}

function mergeSnippetFile(sourcePath, targetPath) {
  const source = readJsonObject(sourcePath, {});
  const target = readJsonObject(targetPath, {});
  const merged = {
    ...target,
    ...source,
  };
  writeJsonObject(targetPath, merged);
}

export function syncSnippets(sourceDir, targetDir, mode) {
  if (!existsSync(sourceDir)) {
    throw new Error(`Source snippets folder not found: ${sourceDir}`);
  }

  if (mode === "replace") {
    rmSync(targetDir, { recursive: true, force: true });
    mkdirSync(dirname(targetDir), { recursive: true });
    cpSync(sourceDir, targetDir, { recursive: true, force: true });
    return listFilesRecursive(targetDir).length;
  }

  const sourceFiles = listFilesRecursive(sourceDir);
  for (const relPath of sourceFiles) {
    const sourcePath = join(sourceDir, relPath);
    const targetPath = join(targetDir, relPath);
    mkdirSync(dirname(targetPath), { recursive: true });

    if (sourcePath.toLowerCase().endsWith(".json")) {
      mergeSnippetFile(sourcePath, targetPath);
    } else {
      cpSync(sourcePath, targetPath, { force: true });
    }
  }

  return sourceFiles.length;
}
