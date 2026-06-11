import { diffLines } from "diff";
import { bucketFor, extensionOf, normalizePath, type Bucket } from "./buckets.js";
import { safeToolName } from "./sanitize.js";
import type { WarningCollector } from "./warnings.js";

/** The only four tools whose output is ever counted (spec scope statement). */
export const COUNTED_WRITERS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);

/**
 * Known non-writer tools exempt from the suspect-writer heuristic. The heuristic
 * itself stays paranoid (detect any path-key + big-string shape); this allowlist is
 * the ONLY escape hatch. Each entry provably trips the shape but never writes files —
 * without the exemption every affected user sees a warning, which trains them to
 * ignore it.
 */
export const SUSPECT_WRITER_ALLOWLIST = new Set([
  // ExitPlanMode input is { plan (long multiline text), planFilePath, allowedPrompts };
  // planFilePath matches /file/ and plan is a >500-char multiline string, so it trips
  // the heuristic — but it only presents a plan for approval, never touching the disk.
  "ExitPlanMode",
]);

export interface LineBuckets {
  code: number;
  docs: number;
  config: number;
  styles: number;
  generated: number;
  total: number;
}

export interface OutputMetrics {
  linesAdded: LineBuckets;
  linesRemoved: LineBuckets;
  grossLinesWritten: number;
  filesTouched: number;
  filesCreated: number;
  byLanguage: { lang: string; linesAdded: number; files: number }[];
  byProject: { project: string; linesAdded: number; sessions: number }[];
  writes: number;
  edits: number;
  multiEdits: number;
  notebookEdits: number;
}

interface ToolUseContext {
  /** Project basename the session belongs to (modal cwd basename). */
  project: string;
}

function emptyBuckets(): LineBuckets {
  return { code: 0, docs: 0, config: 0, styles: 0, generated: 0, total: 0 };
}

/** Lines in a tool-supplied string. Blank lines count; a trailing newline does not add a line. */
export function countLines(s: string): number {
  if (s.length === 0) return 0;
  const lines = s.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  return lines.length;
}

/** Ensure a trailing newline so diffLines treats the last line as a whole line. */
function nl(s: string): string {
  return s.length === 0 || s.endsWith("\n") ? s : `${s}\n`;
}

function diffCounts(oldStr: string, newStr: string): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const part of diffLines(nl(oldStr), nl(newStr))) {
    if (part.added) added += part.count ?? 0;
    else if (part.removed) removed += part.count ?? 0;
  }
  return { added, removed };
}

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

/**
 * The trust core. Feed tool_use events in corpus-chronological order; LOC is
 * diff-honest: Write-over-Write and Edit count only the line delta
 * (spec counting rules 1-7).
 */
export class LocEngine {
  private lastContent = new Map<string, string>();
  private touched = new Set<string>();
  private created = new Set<string>();
  private added = emptyBuckets();
  private removed = emptyBuckets();
  private gross = 0;
  private byLang = new Map<string, { linesAdded: number; files: Set<string> }>();
  private byProject = new Map<string, number>();
  private seenUnknownExt = new Set<string>();
  private counters = { writes: 0, edits: 0, multiEdits: 0, notebookEdits: 0 };

  constructor(private warnings: WarningCollector) {}

  applyToolUse(name: string, input: unknown, ctx: ToolUseContext): void {
    if (typeof input !== "object" || input === null) {
      if (COUNTED_WRITERS.has(name)) this.warnings.tally("skippedMalformedRecord", { tool: name });
      return;
    }
    const inp = input as Record<string, unknown>;
    switch (name) {
      case "Write": {
        const filePath = str(inp.file_path);
        const content = str(inp.content);
        if (filePath === undefined || content === undefined) {
          this.warnings.tally("skippedMalformedRecord", { tool: name });
          return;
        }
        this.counters.writes += 1;
        const p = normalizePath(filePath);
        const prior = this.lastContent.get(p);
        this.gross += countLines(content);
        if (prior === undefined) {
          this.created.add(p);
          this.record(p, ctx, countLines(content), 0);
        } else {
          const { added, removed } = diffCounts(prior, content);
          this.record(p, ctx, added, removed);
        }
        this.lastContent.set(p, content);
        return;
      }
      case "Edit": {
        const filePath = str(inp.file_path);
        const oldString = str(inp.old_string);
        const newString = str(inp.new_string);
        if (filePath === undefined || oldString === undefined || newString === undefined) {
          this.warnings.tally("skippedMalformedRecord", { tool: name });
          return;
        }
        this.counters.edits += 1;
        // replace_all is deliberately counted once: occurrence count is not in the log.
        this.applyEdit(normalizePath(filePath), oldString, newString, ctx);
        return;
      }
      case "MultiEdit": {
        const filePath = str(inp.file_path);
        const edits = Array.isArray(inp.edits) ? inp.edits : undefined;
        if (filePath === undefined || edits === undefined) {
          this.warnings.tally("skippedMalformedRecord", { tool: name });
          return;
        }
        this.counters.multiEdits += 1;
        for (const e of edits) {
          if (typeof e !== "object" || e === null) continue;
          const ed = e as Record<string, unknown>;
          const oldString = str(ed.old_string);
          const newString = str(ed.new_string);
          if (oldString === undefined || newString === undefined) continue;
          this.applyEdit(normalizePath(filePath), oldString, newString, ctx);
        }
        return;
      }
      case "NotebookEdit": {
        const filePath = str(inp.notebook_path) ?? str(inp.file_path);
        const newSource = str(inp.new_source);
        const mode = str(inp.edit_mode) ?? "replace";
        if (filePath === undefined) {
          this.warnings.tally("skippedMalformedRecord", { tool: name });
          return;
        }
        this.counters.notebookEdits += 1;
        // No prior cell content in the log: insert/replace count new_source
        // lines as added (conservative), delete counts nothing.
        if (mode !== "delete" && newSource !== undefined) {
          const lines = countLines(newSource);
          this.gross += lines;
          this.record(normalizePath(filePath), ctx, lines, 0);
        }
        return;
      }
      default:
        this.inspectSuspect(name, inp);
    }
  }

  private applyEdit(p: string, oldString: string, newString: string, ctx: ToolUseContext): void {
    const { added, removed } = diffCounts(oldString, newString);
    this.gross += countLines(newString);
    this.record(p, ctx, added, removed);
  }

  private record(p: string, ctx: ToolUseContext, added: number, removed: number): void {
    this.touched.add(p);
    const bucket: Bucket = bucketFor(p, this.warnings, this.seenUnknownExt);
    this.added[bucket] += added;
    this.added.total += added;
    this.removed[bucket] += removed;
    this.removed.total += removed;
    if (bucket !== "generated") {
      // lockfiles and build output are not "languages you wrote"
      const lang = extensionOf(p) || "(none)";
      const entry = this.byLang.get(lang) ?? { linesAdded: 0, files: new Set<string>() };
      entry.linesAdded += added;
      entry.files.add(p);
      this.byLang.set(lang, entry);
    }
    this.byProject.set(ctx.project, (this.byProject.get(ctx.project) ?? 0) + added);
  }

  /** Spec suspect-writer heuristic: detect and warn ONLY, never count. */
  private inspectSuspect(name: string, inp: Record<string, unknown>): void {
    if (SUSPECT_WRITER_ALLOWLIST.has(name)) return;
    // MCP tools are out of scope by the spec's scope statement — code written via MCP is
    // deliberately not counted, so a write-shaped MCP call is working as designed, not an
    // anomaly worth flagging. (mcp__<uuid> names also vary per user, so naming them is futile.)
    if (name.startsWith("mcp__")) return;
    const values = Object.entries(inp);
    const hasPathKey = values.some(([k, v]) => /path|file/i.test(k) && typeof v === "string");
    const hasBigString = Object.values(inp).some(
      (v) => typeof v === "string" && v.length > 500 && v.includes("\n"),
    );
    if (hasPathKey && hasBigString) {
      this.warnings.tally("suspectedWriteTool", { tool: safeToolName(name) });
    }
  }

  result(sessionsByProject: Map<string, number>): OutputMetrics {
    return {
      linesAdded: { ...this.added },
      linesRemoved: { ...this.removed },
      grossLinesWritten: this.gross,
      filesTouched: this.touched.size,
      filesCreated: this.created.size,
      byLanguage: [...this.byLang.entries()]
        .map(([lang, e]) => ({ lang, linesAdded: e.linesAdded, files: e.files.size }))
        .sort((a, b) => b.linesAdded - a.linesAdded),
      byProject: [...new Set([...this.byProject.keys(), ...sessionsByProject.keys()])]
        .map((project) => ({
          project,
          linesAdded: this.byProject.get(project) ?? 0,
          sessions: sessionsByProject.get(project) ?? 0,
        }))
        .sort((a, b) => b.linesAdded - a.linesAdded),
      ...this.counters,
    };
  }
}
