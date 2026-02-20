import { existsSync, readFileSync, writeFileSync } from "fs";
import { parse, printParseErrorCode } from "jsonc-parser";

export function readSourceKeybindings(keybindingsPath) {
  if (!existsSync(keybindingsPath)) {
    throw new Error(`Source keybindings.json not found: ${keybindingsPath}`);
  }

  const raw = readFileSync(keybindingsPath, "utf-8");
  const errors = [];
  const parsed = parse(raw, errors, { allowTrailingComma: true });

  if (errors.length > 0) {
    const firstError = errors[0];
    throw new Error(
      `Invalid JSON in source keybindings.json: ${printParseErrorCode(firstError.error)} at offset ${firstError.offset}`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Source keybindings.json must be an array");
  }

  return parsed;
}

export function syncKeybindings(sourceKeybindings, targetPath) {
  let targetKeybindings = [];

  if (existsSync(targetPath)) {
    const raw = readFileSync(targetPath, "utf-8");
    const errors = [];
    const parsed = parse(raw, errors, { allowTrailingComma: true });

    if (errors.length === 0 && Array.isArray(parsed)) {
      targetKeybindings = parsed;
    }
  }

  // Merge: source keybindings override target ones with same key+command combo
  const merged = [...targetKeybindings];

  for (const sourceBinding of sourceKeybindings) {
    const existingIndex = merged.findIndex(
      (t) => t.key === sourceBinding.key && t.command === sourceBinding.command,
    );

    if (existingIndex >= 0) {
      merged[existingIndex] = sourceBinding;
    } else {
      merged.push(sourceBinding);
    }
  }

  writeFileSync(targetPath, JSON.stringify(merged, null, 2) + "\n", "utf-8");
  return merged;
}
