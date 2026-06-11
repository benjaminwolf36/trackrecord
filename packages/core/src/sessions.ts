import { basename } from "node:path";
import type { RawRecord, SourceFile } from "./types.js";

export interface ActivityMetrics {
  sessions: number;
  subagentRuns: number;
  projects: number;
  activeDays: number;
  longestStreak: number;
  currentStreak: number;
  humanPrompts: number;
  assistantTurns: number;
  firstSession: string | null;
  byEntrypoint: Record<string, number>;
  compactions: number;
}

interface FileState {
  file: SourceFile;
  humanPrompts: number;
  requestIds: Set<string>;
  cwdCounts: Map<string, number>;
  entrypointCounts: Map<string, number>;
  firstTimestamp: string | null;
}

function get(record: RawRecord, key: string): unknown {
  return record[key];
}

function modal<K>(counts: Map<K, number>): K | undefined {
  let best: K | undefined;
  let bestCount = 0;
  for (const [k, c] of counts) {
    if (c > bestCount) {
      best = k;
      bestCount = c;
    }
  }
  return best;
}

/** A user record whose message content is human text (spec session rules). */
export function isHumanPrompt(record: RawRecord): boolean {
  if (record.type !== "user") return false;
  if (record.toolUseResult !== undefined) return false;
  if (record.isMeta === true) return false;
  if (record.isCompactSummary === true) return false;
  if (record.isSidechain === true) return false;
  const message = get(record, "message");
  if (typeof message !== "object" || message === null) return false;
  const content = (message as Record<string, unknown>).content;
  if (typeof content === "string") return content.length > 0;
  if (Array.isArray(content)) {
    return content.some(
      (b) => typeof b === "object" && b !== null && (b as Record<string, unknown>).type === "text",
    );
  }
  return false;
}

/**
 * Sessions are keyed by FILENAME, never sessionId (subagent files reuse the
 * parent's sessionId by design). A session = a main file with >=1 human
 * prompt AND >=1 assistant turn.
 */
export class SessionEngine {
  private current: FileState | null = null;
  private humanPrompts = 0;
  private globalRequestIds = new Set<string>();
  private compactions = 0;
  private subagentRuns = 0;
  private activeDayKeys = new Set<string>();
  private sessionsByProject = new Map<string, number>();
  private byEntrypoint = new Map<string, number>();
  private firstSession: string | null = null;
  private sessionCount = 0;

  startFile(file: SourceFile): void {
    this.finishFile();
    if (file.isAgent) this.subagentRuns += 1;
    this.current = {
      file,
      humanPrompts: 0,
      requestIds: new Set(),
      cwdCounts: new Map(),
      entrypointCounts: new Map(),
      firstTimestamp: null,
    };
  }

  addRecord(record: RawRecord): void {
    const state = this.current;
    if (!state) return;

    const cwd = get(record, "cwd");
    if (typeof cwd === "string" && cwd.length > 0) {
      state.cwdCounts.set(cwd, (state.cwdCounts.get(cwd) ?? 0) + 1);
    }
    const entrypoint = get(record, "entrypoint");
    if (typeof entrypoint === "string" && entrypoint.length > 0) {
      state.entrypointCounts.set(entrypoint, (state.entrypointCounts.get(entrypoint) ?? 0) + 1);
    }
    const timestamp = get(record, "timestamp");
    if (typeof timestamp === "string" && state.firstTimestamp === null) {
      state.firstTimestamp = timestamp;
    }

    if (record.type === "system" && record.subtype === "compact_boundary") {
      this.compactions += 1; // compactions never split sessions
      return;
    }
    if (record.type === "assistant") {
      const requestId = get(record, "requestId");
      const key = typeof requestId === "string" && requestId.length > 0
        ? requestId
        : `uuid:${String(get(record, "uuid") ?? Math.random())}`;
      state.requestIds.add(key);
      this.globalRequestIds.add(key);
      return;
    }
    if (isHumanPrompt(record)) {
      state.humanPrompts += 1;
      this.humanPrompts += 1;
      if (typeof timestamp === "string") {
        const d = new Date(timestamp);
        if (!Number.isNaN(d.getTime())) this.activeDayKeys.add(dayKey(d));
      }
    }
  }

  finishFile(): void {
    const state = this.current;
    this.current = null;
    if (!state || state.file.isAgent) return;
    if (state.humanPrompts < 1 || state.requestIds.size < 1) return; // stub: not a session
    this.sessionCount += 1;
    const project = basename(modal(state.cwdCounts) ?? "unknown");
    this.sessionsByProject.set(project, (this.sessionsByProject.get(project) ?? 0) + 1);
    const entrypoint = modal(state.entrypointCounts) ?? "unknown";
    this.byEntrypoint.set(entrypoint, (this.byEntrypoint.get(entrypoint) ?? 0) + 1);
    if (state.firstTimestamp !== null) {
      if (this.firstSession === null || state.firstTimestamp < this.firstSession) {
        this.firstSession = state.firstTimestamp;
      }
    }
  }

  projectSessions(): Map<string, number> {
    return this.sessionsByProject;
  }

  result(now: Date): ActivityMetrics {
    this.finishFile();
    const days = [...this.activeDayKeys].sort();
    const { longest, current } = streaks(days, now);
    return {
      sessions: this.sessionCount,
      subagentRuns: this.subagentRuns,
      projects: this.sessionsByProject.size,
      activeDays: days.length,
      longestStreak: longest,
      currentStreak: current,
      humanPrompts: this.humanPrompts,
      assistantTurns: this.globalRequestIds.size,
      firstSession: this.firstSession,
      byEntrypoint: Object.fromEntries(this.byEntrypoint),
      compactions: this.compactions,
    };
  }
}

/** Calendar day in the local timezone (spec: active day = local-tz day). */
function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayNumber(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / 86_400_000;
}

function streaks(sortedDays: string[], now: Date): { longest: number; current: number } {
  if (sortedDays.length === 0) return { longest: 0, current: 0 };
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    run = dayNumber(sortedDays[i]!) - dayNumber(sortedDays[i - 1]!) === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }
  // current streak: consecutive run ending today or yesterday relative to `now`
  const today = dayNumber(dayKey(now));
  const last = dayNumber(sortedDays[sortedDays.length - 1]!);
  if (today - last > 1) return { longest, current: 0 };
  let current = 1;
  for (let i = sortedDays.length - 1; i > 0; i--) {
    if (dayNumber(sortedDays[i]!) - dayNumber(sortedDays[i - 1]!) === 1) current += 1;
    else break;
  }
  return { longest, current };
}
