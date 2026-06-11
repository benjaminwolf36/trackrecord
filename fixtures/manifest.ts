/**
 * Expected counts for the synthetic fixture corpus under fixtures/projects/.
 * Single source of truth — tests assert against this, fixtures and manifest
 * must change together.
 *
 * Date-sensitive expectations (currentStreak) assume an injected "now" of
 * NOW_FOR_TESTS and UTC day boundaries (tests run with TZ=UTC).
 */

export const NOW_FOR_TESTS = "2026-06-09T12:00:00.000Z";

export const corpus = {
  files: 9, // 8 main session files + 1 agent file
  mainFiles: 8,
  agentFiles: 1,
  totalLines: 57,
  parsedRecords: 56, // one deliberately unparseable line
  ccVersionRange: ["2.0.70", "2.1.170"] as const,
  dateRange: ["2026-06-01T10:00:00.000Z", "2026-06-08T13:05:05.000Z"] as const,

  warnings: {
    unknownRecordType: { frobnicate: 1 },
    unparseableLine: 1,
    suspectedWriteTool: { Patch: 1 },
    unknownExtension: { ipynb: 1, xyz: 1 },
    skippedMalformedRecord: 1, // the empty-input Edit
  },

  output: {
    linesAdded: { code: 10, docs: 3, config: 3, styles: 3, generated: 4, total: 23 },
    linesRemoved: { code: 4, docs: 0, config: 0, styles: 0, generated: 0, total: 4 },
    grossLinesWritten: 25, // every content/new_string line pushed through counted tools, pre-diff
    filesTouched: 9,
    filesCreated: 6,
    writes: 7,
    edits: 2, // empty-input Edit is skipped, not counted
    multiEdits: 1,
    notebookEdits: 1,
    tsLinesAdded: 10, // byLanguage: all fixture code is .ts
  },

  delivery: {
    pullRequests: 3, // pull/7, pull/8 (deduped), other-lib pull/2
    repositories: 2,
    branches: 3, // main, claude/fix-1, dev
    claudeBranches: 1,
  },

  activity: {
    sessions: 7, // stub excluded; agent file never a session
    subagentRuns: 1,
    projects: 2, // demo-app, other-proj
    activeDays: 6, // 06-01,02,03,05,07,08 (UTC)
    longestStreak: 3, // 06-01..03
    currentStreak: 2, // 06-07..08 run; last active 06-08 is "yesterday" vs now 06-09
    humanPrompts: 10, // excludes toolUseResult, isMeta, isCompactSummary, sidechain
    assistantTurns: 22, // deduped by requestId (req_003 appears twice)
    firstSession: "2026-06-01T10:00:00.000Z",
    byEntrypoint: { cli: 6, "claude-desktop": 1 },
    compactions: 1,
  },

  tools: {
    builtin: { Write: 7, Edit: 3, MultiEdit: 1, NotebookEdit: 1, Agent: 1, Patch: 1 },
    mcp: { totalCalls: 0, servers: 0 },
  },

  tokens: {
    input: 629,
    output: 299,
    cacheRead: 35,
    cacheCreation: 17,
  },

  /** Sentinel inside the file-history-snapshot body. Must never appear in any output. */
  snapshotSentinel: "SECRET-MUST-NEVER-BE-READ",
};
