import { basename } from "node:path";
import { classifyRecord } from "./classify.js";
import { DeliveryEngine } from "./delivery.js";
import { LocEngine, COUNTED_WRITERS } from "./loc.js";
import { discoverFiles, readRecords } from "./reader.js";
import { safeVersion } from "./sanitize.js";
import { SCHEMA_VERSION, type Metrics } from "./schema.js";
import { SessionEngine } from "./sessions.js";
import { TokensEngine } from "./tokens.js";
import { ToolsEngine } from "./tools.js";
import type { RawRecord } from "./types.js";
import { WarningCollector } from "./warnings.js";

export interface AnalyzeOptions {
  /** Directory containing Claude Code project transcripts. */
  dir: string;
  /** Injectable clock for deterministic tests; defaults to the real now. */
  now?: Date;
  /** Only count records timestamped on/after this instant (card --since/--range). */
  since?: Date;
  /** Only count records timestamped on/before this instant. */
  until?: Date;
}

interface ToolEvent {
  name: string;
  input: unknown;
  timestamp: string;
  project: string;
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

function toolUses(record: RawRecord): { name: string; input: unknown }[] {
  if (record.type !== "assistant") return [];
  const message = record.message;
  if (typeof message !== "object" || message === null) return [];
  const content = (message as Record<string, unknown>).content;
  if (!Array.isArray(content)) return [];
  const out: { name: string; input: unknown }[] = [];
  for (const block of content) {
    if (typeof block !== "object" || block === null) continue;
    const b = block as Record<string, unknown>;
    if (b.type === "tool_use" && typeof b.name === "string") {
      out.push({ name: b.name, input: b.input });
    }
  }
  return out;
}

/**
 * The core's entire public API: logs in, schema object out.
 * Pure analysis - no printing, no network, no fs writes.
 */
export async function analyze(options: AnalyzeOptions): Promise<Metrics> {
  const now = options.now ?? new Date();
  const warnings = new WarningCollector();
  const sessions = new SessionEngine();
  const delivery = new DeliveryEngine();
  const tools = new ToolsEngine();
  const tokens = new TokensEngine();
  const loc = new LocEngine(warnings);

  const files = await discoverFiles(options.dir);
  let records = 0;
  let minVersion: string | null = null;
  let maxVersion: string | null = null;
  let minTs: string | null = null;
  let maxTs: string | null = null;
  // LOC events are replayed in corpus-chronological order so Write-over-Write
  // diffs against the truly most recent logged content (spec rule 2).
  const locEvents: ToolEvent[] = [];

  for (const file of files) {
    sessions.startFile(file);
    for await (const raw of readRecords(file.path, warnings)) {
      records += 1;
      const record = classifyRecord(raw, warnings);
      if (!record) continue;
      if (options.since !== undefined || options.until !== undefined) {
        const ts = typeof record.timestamp === "string" ? Date.parse(record.timestamp) : NaN;
        if (!Number.isNaN(ts)) {
          if (options.since !== undefined && ts < options.since.getTime()) continue;
          if (options.until !== undefined && ts > options.until.getTime()) continue;
        }
      }

      // sanitized: a corrupt version value could smuggle a path into --json output
      const version = typeof record.version === "string" ? safeVersion(record.version) : null;
      if (version !== null) {
        if (minVersion === null || compareVersions(version, minVersion) < 0) minVersion = version;
        if (maxVersion === null || compareVersions(version, maxVersion) > 0) maxVersion = version;
      }
      const timestamp = record.timestamp;
      if (typeof timestamp === "string" && timestamp.length > 0) {
        if (minTs === null || timestamp < minTs) minTs = timestamp;
        if (maxTs === null || timestamp > maxTs) maxTs = timestamp;
      }

      sessions.addRecord(record);
      delivery.addRecord(record, file.isAgent);
      tokens.addAssistant(record);

      const project = basename(typeof record.cwd === "string" && record.cwd ? record.cwd : "unknown");
      for (const { name, input } of toolUses(record)) {
        tools.addToolUse(name);
        if (COUNTED_WRITERS.has(name)) {
          locEvents.push({ name, input, timestamp: typeof timestamp === "string" ? timestamp : "", project });
        } else {
          loc.applyToolUse(name, input, { project }); // suspect heuristic only
        }
      }
    }
    sessions.finishFile();
  }

  locEvents.sort((a, b) => (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0));
  for (const e of locEvents) loc.applyToolUse(e.name, e.input, { project: e.project });

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: now.toISOString(),
    source: {
      files: files.length,
      records,
      ccVersionRange: minVersion !== null && maxVersion !== null ? [minVersion, maxVersion] : [null, null],
      dateRange: minTs !== null && maxTs !== null ? [minTs, maxTs] : [null, null],
      parserWarnings: warnings.toJSON(),
    },
    output: loc.result(sessions.projectSessions()),
    delivery: delivery.result(),
    activity: sessions.result(now),
    tools: tools.result(),
    tokens: tokens.result(),
    git: { reserved: true },
  };
}
