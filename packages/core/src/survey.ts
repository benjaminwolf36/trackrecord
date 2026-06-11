import { classifyRecord } from "./classify.js";
import { COUNTED_WRITERS } from "./loc.js";
import { discoverFiles, readRecords } from "./reader.js";
import {
  redactMcpToolName,
  safeEnumValue,
  safeKeyName,
  safeToolName,
  safeTypeName,
  safeVersion,
} from "./sanitize.js";
import { isHumanPrompt } from "./sessions.js";
import type { RawRecord } from "./types.js";
import { WarningCollector, type ParserWarning } from "./warnings.js";

/**
 * Structure-only corpus survey backing `trackrecord doctor`.
 * NEVER collects: message text, prompts, code content, file paths
 * (only .jsonl basenames), or cwd values. Field NAMES only.
 */
export interface Survey {
  files: { total: number; main: number; agent: number; stubs: number };
  recordTypes: { type: string; count: number; keys: string[] }[];
  editToolShapes: { tool: string; shape: string; count: number }[];
  versionRange: [string, string] | [null, null];
  gatedFields: {
    entrypointValues: Record<string, number>;
    promptSourceValues: Record<string, number>;
    recordsWithEntrypoint: number;
    recordsWithoutEntrypoint: number;
  };
  linkage: {
    sidechainRecords: number;
    compactBoundaries: number;
    reusedSessionIds: number;
  };
  toolCounts: { name: string; count: number }[];
  usageKeys: string[];
  warnings: ParserWarning[];
}

function redactToolName(name: string): string {
  return name.startsWith("mcp__") ? redactMcpToolName(name) : safeToolName(name);
}

function toolUseBlocks(record: RawRecord): { name: string; input: unknown }[] {
  if (record.type !== "assistant") return [];
  const message = record.message;
  if (typeof message !== "object" || message === null) return [];
  const content = (message as Record<string, unknown>).content;
  if (!Array.isArray(content)) return [];
  return content
    .filter(
      (b): b is Record<string, unknown> =>
        typeof b === "object" && b !== null && (b as Record<string, unknown>).type === "tool_use",
    )
    .map((b) => ({ name: typeof b.name === "string" ? b.name : "<unnamed>", input: b.input }));
}

export async function survey(dir: string): Promise<Survey> {
  const warnings = new WarningCollector();
  const typeInfo = new Map<string, { count: number; keys: Set<string> }>();
  const editShapes = new Map<string, number>();
  const toolCounts = new Map<string, number>();
  const usageKeys = new Set<string>();
  const entrypointValues = new Map<string, number>();
  const promptSourceValues = new Map<string, number>();
  const sessionIdFiles = new Map<string, Set<string>>();
  let recordsWithEntrypoint = 0;
  let recordsWithoutEntrypoint = 0;
  let sidechainRecords = 0;
  let compactBoundaries = 0;
  let stubs = 0;
  let minVersion: string | null = null;
  let maxVersion: string | null = null;

  const files = await discoverFiles(dir);
  for (const file of files) {
    let humanPrompts = 0;
    let assistantTurns = 0;
    for await (const raw of readRecords(file.path, warnings)) {
      // sanitized at collection: types and field NAMES are the only thing kept,
      // and a corrupt line could smuggle content into either
      const typeName = safeTypeName(String(raw.type ?? "<invalid-type>"));
      const info = typeInfo.get(typeName) ?? { count: 0, keys: new Set<string>() };
      info.count += 1;
      for (const k of Object.keys(raw)) info.keys.add(safeKeyName(k));
      typeInfo.set(typeName, info);

      const record = classifyRecord(raw, warnings);
      if (!record) continue;

      if (record.isSidechain === true) sidechainRecords += 1;
      if (record.type === "system" && record.subtype === "compact_boundary") compactBoundaries += 1;
      if (record.type === "assistant") assistantTurns += 1;
      if (isHumanPrompt(record)) humanPrompts += 1;

      if (typeof record.sessionId === "string") {
        const set = sessionIdFiles.get(record.sessionId) ?? new Set<string>();
        set.add(file.basename);
        sessionIdFiles.set(record.sessionId, set);
      }

      const version = typeof record.version === "string" ? safeVersion(record.version) : null;
      if (version !== null) {
        if (minVersion === null || version.localeCompare(minVersion, "en", { numeric: true }) < 0) minVersion = version;
        if (maxVersion === null || version.localeCompare(maxVersion, "en", { numeric: true }) > 0) maxVersion = version;
      }
      if (record.type === "user" || record.type === "assistant") {
        if (typeof record.entrypoint === "string") {
          recordsWithEntrypoint += 1;
          const entry = safeEnumValue(record.entrypoint);
          entrypointValues.set(entry, (entrypointValues.get(entry) ?? 0) + 1);
        } else {
          recordsWithoutEntrypoint += 1;
        }
        if (typeof record.promptSource === "string") {
          const src = safeEnumValue(record.promptSource);
          promptSourceValues.set(src, (promptSourceValues.get(src) ?? 0) + 1);
        }
      }

      const message = record.message;
      if (typeof message === "object" && message !== null) {
        const usage = (message as Record<string, unknown>).usage;
        if (typeof usage === "object" && usage !== null) {
          for (const k of Object.keys(usage)) usageKeys.add(safeKeyName(k));
        }
      }

      for (const { name, input } of toolUseBlocks(record)) {
        const redacted = redactToolName(name);
        toolCounts.set(redacted, (toolCounts.get(redacted) ?? 0) + 1);
        if (COUNTED_WRITERS.has(name)) {
          const shape =
            typeof input === "object" && input !== null && Object.keys(input).length > 0
              ? Object.keys(input).map(safeKeyName).sort().join(",")
              : "(empty)";
          editShapes.set(`${name}|${shape}`, (editShapes.get(`${name}|${shape}`) ?? 0) + 1);
        }
      }
    }
    if (!file.isAgent && (humanPrompts < 1 || assistantTurns < 1)) stubs += 1;
  }

  return {
    files: {
      total: files.length,
      main: files.filter((f) => !f.isAgent).length,
      agent: files.filter((f) => f.isAgent).length,
      stubs,
    },
    recordTypes: [...typeInfo.entries()]
      .map(([type, i]) => ({ type, count: i.count, keys: [...i.keys].sort() }))
      .sort((a, b) => b.count - a.count),
    editToolShapes: [...editShapes.entries()]
      .map(([key, count]) => {
        const [tool, shape] = key.split("|");
        return { tool: tool ?? "", shape: shape ?? "", count };
      })
      .sort((a, b) => b.count - a.count),
    versionRange: minVersion !== null && maxVersion !== null ? [minVersion, maxVersion] : [null, null],
    gatedFields: {
      entrypointValues: Object.fromEntries(entrypointValues),
      promptSourceValues: Object.fromEntries(promptSourceValues),
      recordsWithEntrypoint,
      recordsWithoutEntrypoint,
    },
    linkage: {
      sidechainRecords,
      compactBoundaries,
      reusedSessionIds: [...sessionIdFiles.values()].filter((s) => s.size > 1).length,
    },
    toolCounts: [...toolCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    usageKeys: [...usageKeys].sort(),
    warnings: warnings.toJSON(),
  };
}
