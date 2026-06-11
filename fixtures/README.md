# Fixture corpus

All files here are **synthetic** — hand-authored dummy data, never real log content.
Shapes mirror the real Claude Code JSONL format (field-name sets verified against a
real corpus structure survey on 2026-06-11; values are invented).

Layout mimics `~/.claude/projects/<munged-cwd>/<sessionId>.jsonl`.

Coverage (per spec "Fixture corpus" requirements):
- every known record type (13) — `session-all-types`
- both edit-tool shapes + Write/Write-again diff + replace_all — `basic`, `edge-cases`
- MultiEdit + NotebookEdit (speculative, from documented tool shapes) — `edge-cases`
- subagent file pair (shared sessionId, `isSidechain: true`) — `with-subagent`
- compaction boundary — `compaction`
- empty-input Edit, unknown record type, unparseable line, suspected-write-tool — `edge-cases`
- version-gated field presence/absence — `version-gates`
- stub file that must not count as a session — `stub`
- pr-link dedupe + claude/ branches — `pr-links`

`manifest.ts` is the single source of truth for expected counts; tests assert against it.
The string `SECRET-MUST-NEVER-BE-READ` inside the file-history-snapshot record exists to
prove the parser never reads snapshot bodies — it must never appear in any output.
