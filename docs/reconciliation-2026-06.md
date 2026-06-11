# Reconciliation against the reference corpus — 2026-06-11

Run: built CLI (`trackrecord --json`) against the real `~/.claude/projects/` on the
reference machine, compared to the 2026-06-11 pre-build survey in the spec. The corpus
is live — it grew during the build session itself, and a Claude Code cleanup pass ran
between survey and reconciliation — so count criteria are evaluated as
"explained drift", while structural criteria must hold exactly.

| Acceptance criterion | Expected (survey) | Actual | Verdict |
|---|---|---|---|
| Files scanned | 969 | 953 | ✅ matches filesystem exactly (953 .jsonl on disk at run time); 16 files deleted by Claude Code cleanup between survey and run |
| Records | 87,851 | 88,396 | ✅ upward live drift (build session appended logs) |
| Unparseable lines | 0 | 0 | ✅ exact |
| Unknown record types | 0 | 0 | ✅ exact — all 13 types recognized |
| writes | 757 | 821 | ✅ drift (this build performed ~60 Writes itself) |
| edits | 1,584 | 1,599 | ✅ drift |
| multiEdits / notebookEdits | 0 / 0 | 0 / 0 | ✅ exact |
| Empty-input Edit skipped + warned | 1 | 1 (`skippedMalformedRecord:Edit`) | ✅ exact |
| subagentRuns = agent-*.jsonl count | match | 102 = 102 | ✅ exact |
| 13 reused sessionIds → no duplicate sessions | no dups | 13 reused, sessions keyed by filename | ✅ exact |
| Stub files excluded from sessions | 16 (<5 records) | the 16 tiny stubs were deleted by cleanup before the run; separately, 630 queue-stub main files (uniform shape: 2 queue-operation, 10 attachment, 1 user, 1 last-prompt, 0 assistant) correctly fail the ≥1-assistant rule | ✅ rule verified |
| humanPrompts ≪ raw user records | ≪ 19,135 | 3,127 vs 19,335 raw | ✅ |
| pullRequests = distinct prUrl ≪ raw pr-links | ≪ 3,438 | 221 | ✅ |
| compactions | 91 | 91 | ✅ exact |
| Deduped assistant turns < raw assistant records | < 28,072 | 14,822 vs 28,401 raw | ✅ |
| Doctor output contains zero code/paths/prompts | manual review | grep for paths, username, URLs, cwd values: zero hits | ✅ |
| Built packages free of network imports | none | invariants suite green (fetch/http/net/dns/tls/undici/WebSocket scan over dist) | ✅ |

## Notable real-corpus findings

- **Suspect-writer heuristic earns its keep on day one:** flagged `ExitPlanMode` (23),
  a context-mode MCP execute-file tool (9), and `browser_evaluate` (2) — all tools that
  carry file-path-plus-big-string inputs but are correctly NOT counted as written code.
- New record fields unseen in fixtures (`slug`, `attributionAgent`, `mcpMeta`,
  `compactMetadata`, retry fields…) were ignored cleanly per the unknown-field rule —
  no warnings, no wrong numbers.
- Version range 2.0.77–2.1.170; `entrypoint` degrades to "unknown" on 7 old sessions
  as designed.
- Full-corpus analysis takes ~2.8s on the reference machine.

Verdict: **all acceptance criteria pass.**
