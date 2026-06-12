export const KNOWN_RECORD_TYPES = [
  "assistant",
  "attachment",
  "user",
  "queue-operation",
  "last-prompt",
  "pr-link",
  "custom-title",
  "system",
  "mode",
  "worktree-state",
  "file-history-snapshot",
  "permission-mode",
  "ai-title",
  // session-title records written by Claude Code ≤2.0.74 (public-corpus harvest
  // 2026-06-12): {"type":"summary","summary":"<title>","leafUuid":"..."} —
  // known and ignored; the title text is never read.
  "summary",
] as const;

export type KnownRecordType = (typeof KNOWN_RECORD_TYPES)[number];

/** A parsed JSONL record. Only `type` is guaranteed; everything else is unknown. */
export interface RawRecord {
  type: string;
  [key: string]: unknown;
}

export interface SourceFile {
  /** Absolute path to the .jsonl file. */
  path: string;
  /** Basename only — the only path component that may ever be surfaced. */
  basename: string;
  /** True for agent-*.jsonl subagent transcripts. */
  isAgent: boolean;
}
