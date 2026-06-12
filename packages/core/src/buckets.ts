import { safeExt } from "./sanitize.js";
import type { WarningCollector } from "./warnings.js";

export type Bucket = "code" | "docs" | "config" | "styles" | "generated";

const CODE = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "cjs", "py", "rb", "go", "rs", "java", "kt",
  "swift", "c", "cc", "cpp", "h", "hpp", "cs", "php", "sql", "sh", "bash",
  "zsh", "ps1", "vue", "svelte", "astro",
]);
// html/htm: markup, not code — conservative bucketing wins the ambiguity
// (public-corpus harvest decision, 2026-06-12)
const DOCS = new Set(["md", "mdx", "txt", "rst", "adoc", "html", "htm"]);
const CONFIG = new Set(["json", "jsonc", "yaml", "yml", "toml", "ini", "env", "xml", "csv"]);
const STYLES = new Set(["css", "scss", "sass", "less"]);

const LOCKFILES = new Set([
  "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "cargo.lock",
  "poetry.lock", "gemfile.lock", "composer.lock", "bun.lockb", "bun.lock",
  "uv.lock", "go.sum", "gradle.lockfile", "flake.lock",
]);
const GENERATED_SEGMENTS = ["/dist/", "/build/", "/.next/", "/node_modules/"];

export function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}

export function extensionOf(filePath: string): string {
  const base = normalizePath(filePath).split("/").pop() ?? "";
  const i = base.lastIndexOf(".");
  return i > 0 ? base.slice(i + 1).toLowerCase() : "";
}

/** Pure lookup for display layers: is this extension in the code bucket? */
export function isCodeExt(ext: string): boolean {
  return CODE.has(ext);
}

/**
 * Spec rule 6. Generated wins over everything (lockfiles, *.min.*, build
 * output paths); unknown extensions land in config and tally a warning the
 * first time each extension is seen.
 */
export function bucketFor(filePath: string, warnings: WarningCollector, seenUnknown: Set<string>): Bucket {
  const p = normalizePath(filePath);
  const base = (p.split("/").pop() ?? "").toLowerCase();
  if (LOCKFILES.has(base)) return "generated";
  if (base.includes(".min.")) return "generated";
  if (GENERATED_SEGMENTS.some((seg) => p.includes(seg))) return "generated";

  const ext = extensionOf(p);
  if (CODE.has(ext)) return "code";
  if (DOCS.has(ext)) return "docs";
  if (CONFIG.has(ext)) return "config";
  if (STYLES.has(ext)) return "styles";

  const key = safeExt(ext === "" ? "(none)" : ext);
  if (!seenUnknown.has(key)) {
    seenUnknown.add(key);
    warnings.tally("unknownExtension", { ext: key });
  }
  return "config";
}
