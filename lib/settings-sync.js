import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { parse, printParseErrorCode } from "jsonc-parser";

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function readJsonFile(filePath, fallback = {}) {
  if (!existsSync(filePath)) return fallback;
  const raw = readFileSync(filePath, "utf-8");
  const errors = [];
  const parsed = parse(raw, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  });

  if (errors.length > 0) {
    const first = errors[0];
    const position = getLineAndColumn(raw, first.offset);
    throw new Error(
      `${filePath} parse error (${printParseErrorCode(first.error)}) at line ${position.line}, column ${position.column}.`,
    );
  }

  if (!isPlainObject(parsed)) {
    throw new Error(`${filePath} must be a JSON object.`);
  }
  return parsed;
}

function getLineAndColumn(text, offset) {
  let line = 1;
  let column = 1;
  for (let i = 0; i < offset; i++) {
    if (text[i] === "\n") {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  return { line, column };
}

function writeJsonFile(filePath, data) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

export function readSourceSettings(sourcePath) {
  if (!existsSync(sourcePath)) {
    throw new Error(`Source settings not found: ${sourcePath}`);
  }
  return readJsonFile(sourcePath, {});
}

export function syncSettings(sourceSettings, targetPath) {
  const targetSettings = readJsonFile(targetPath, {});
  const merged = {
    ...targetSettings,
    ...sourceSettings,
  };
  writeJsonFile(targetPath, merged);
  return merged;
}

export function readJsonObject(filePath, fallback = {}) {
  return readJsonFile(filePath, fallback);
}

export function writeJsonObject(filePath, data) {
  writeJsonFile(filePath, data);
}
