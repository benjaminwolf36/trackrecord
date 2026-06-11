/**
 * Label sanitizers for everything that can be SURFACED (doctor output,
 * parserWarnings, CLI warnings). The log format controls these values in
 * practice, but a corrupt or hostile line could smuggle prompts, paths, or
 * code into a "type" or a field name — and doctor output must be safe to
 * paste publicly by a user who didn't read it first. Anything that doesn't
 * look like a format-controlled identifier is replaced wholesale; we never
 * truncate-and-show, because a prefix of a secret is still a secret.
 */

/** Record type values: lowercase kebab identifiers (user, pr-link, file-history-snapshot). */
export function safeTypeName(type: string): string {
  return /^[a-z][a-z0-9-]{0,31}$/.test(type) ? type : "<invalid-type>";
}

/** JSON field names: camelCase/snake identifiers (requestId, tool_use_id, isMeta). */
export function safeKeyName(key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]{0,39}$/.test(key) ? key : "<invalid-key>";
}

/** Tool names: Write, ExitPlanMode, mcp-suffix segments (sanitize mcp parts separately). */
export function safeToolName(name: string): string {
  return /^[A-Za-z][A-Za-z0-9_-]{0,47}$/.test(name) ? name : "<invalid-tool>";
}

/** MCP names: drop the server segment entirely, sanitize the trailing tool segment. */
export function redactMcpToolName(name: string): string {
  const suffix = name.split("__").slice(2).join("__");
  return `mcp__<redacted>__${suffix ? safeToolName(suffix) : "<unknown>"}`;
}

/** File extensions: short alphanumerics; "(none)" is the deliberate no-extension bucket. */
export function safeExt(ext: string): string {
  if (ext === "(none)") return ext;
  return /^[a-z0-9]{1,12}$/.test(ext) ? ext : "<nonstandard>";
}

/** Enum-ish values (entrypoint, promptSource): cli, claude-desktop, sdk-ts, user... */
export function safeEnumValue(value: string): string {
  return /^[A-Za-z][A-Za-z0-9-]{0,23}$/.test(value) ? value : "<other>";
}

/** Claude Code version strings: plain semver only; anything else is dropped. */
export function safeVersion(version: string): string | null {
  return /^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(version) ? version : null;
}
