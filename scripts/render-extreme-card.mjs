// Renders the extreme-value validation card (9-digit counts, 15-char language
// names, 44-char MCP tool name, trillion-scale tokens). Values this large
// cannot exist as a parseable corpus, so this exercises the render function
// directly; CLI --dir plumbing is covered by card tests + fixture renders.
// Run: node scripts/render-extreme-card.mjs <out.png>
import { writeFileSync } from "node:fs";
import { renderCardPng } from "../packages/cli/dist/card.js";

const buckets = (n) => ({ code: n, docs: n, config: n, styles: n, generated: n, total: n * 5 });

const extreme = {
  schemaVersion: "1.0.0",
  generatedAt: "2026-06-11T00:00:00.000Z",
  source: {
    files: 99999, records: 999999999,
    ccVersionRange: ["2.0.77", "2.1.170"],
    dateRange: ["2024-01-01T00:00:00.000Z", "2026-12-31T23:59:59.000Z"],
    parserWarnings: [],
  },
  output: {
    linesAdded: buckets(987654321), linesRemoved: buckets(123456789),
    grossLinesWritten: 9999999999, filesTouched: 999999, filesCreated: 888888,
    byLanguage: [
      { lang: "javascriptreact", linesAdded: 987654321, files: 9999 },
      { lang: "typescriptreact", linesAdded: 876543210, files: 8888 },
      { lang: "markdown", linesAdded: 765432109, files: 7777 },
    ],
    byProject: [{ project: "a-very-long-monorepo-project-name-30", linesAdded: 987654321, sessions: 99 }],
    writes: 99999, edits: 99999, multiEdits: 9999, notebookEdits: 999,
  },
  delivery: { pullRequests: 987654321, repositories: 9999, branches: 99999, claudeBranches: 88888 },
  activity: {
    sessions: 999999, subagentRuns: 99999, projects: 9999, activeDays: 99999,
    longestStreak: 3650, currentStreak: 365, humanPrompts: 9999999, assistantTurns: 99999999,
    firstSession: "2024-01-01T00:00:00.000Z", byEntrypoint: { "claude-desktop": 999999 }, compactions: 999999,
  },
  tools: {
    builtin: [{ name: "mcp__<redacted>__execute_file_with_long_name", count: 987654321 }],
    mcp: { totalCalls: 9999999, servers: 99 },
  },
  tokens: {
    input: 999999999, output: 999999999, cacheRead: 9999999999999, cacheCreation: 999999999999,
    apiEquivalentUsd: 9876543.21, pricingTableVersion: "2026-06",
  },
  git: { reserved: true },
};

writeFileSync(process.argv[2] ?? "extreme-card.png", await renderCardPng(extreme));
console.log("rendered", process.argv[2] ?? "extreme-card.png");
