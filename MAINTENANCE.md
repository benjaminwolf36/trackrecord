# MAINTENANCE.md — playbook for Claude Code

This playbook is written FOR Claude Code (or any agent) maintaining trackrecord.
Goal: any Claude Code format change costs the maintainer **one review-and-merge session**.

## The core loop: doctor report → fixture → patch → release

When an issue arrives with `trackrecord doctor` output showing an unknown shape:

1. **Read the doctor report.** It contains record types + counts + field-name sets,
   edit-tool input shapes, version ranges, and anomaly counts. The anomalies section
   tells you exactly what the parser didn't recognize:
   - `unknownRecordType` → a new top-level `type` value
   - `suspectedWriteTool` → a tool that looks like it writes files but isn't counted
   - `skippedMalformedRecord` → a known type with missing expected fields
   - `unparseableLine` → corrupt or non-JSON lines

2. **Build a synthetic fixture.** Add records to `fixtures/projects/` reproducing the
   new shape with DUMMY values — never real log data. Use the field-name sets from the
   doctor report; invent the values. Update `fixtures/manifest.ts` with the new
   expected counts (the manifest is the single source of truth all tests assert
   against).

3. **Patch the parser.**
   - New record type → add to `KNOWN_RECORD_TYPES` in `packages/core/src/types.ts`,
     then handle it (or deliberately ignore it) in the relevant engine.
   - New write tool / changed tool input shape → `packages/core/src/loc.ts`. Follow the
     counting rules in `docs/SPEC.md` ("Counting rules") exactly — diff-honest, conservative,
     never guess.
   - New version-gated field → must be non-load-bearing: absence degrades to
     "unknown", never to wrong numbers.
   - Parser hard rules live in `docs/SPEC.md` ("Parser architecture") — streaming only, never
     throw, never read `file-history-snapshot` past `type`.

4. **Run the suite.** `pnpm build && pnpm test && pnpm typecheck`. The invariants suite
   (`test/invariants.test.ts`) must stay green — zero network markers in built output.

5. **Bump minor** on `@trackrecord/core` and `@trackrecord/cli` (new recognized shapes
   are additive). Breaking schema changes bump major and require updating
   `schema/v1.json` + the schema section of the README.

6. **Draft release notes.** Format: what shape changed in Claude Code (with version
   range from the doctor report), what trackrecord now does with it, whether any
   numbers shift for existing users.

## Invariants you must never break

- **Zero network calls** in any code path of the published packages. The invariants
  test enforces this; do not add dependencies without re-auditing the prod tree
  (`pnpm ls --prod --depth 10 -r --json`).
- **Core purity:** `@trackrecord/core` does no printing, no network, no fs writes.
- **Privacy:** `file-history-snapshot` bodies are never parsed. Doctor output never
  contains message text, prompts, code, paths (jsonl basenames only), or cwd values —
  the negative tests in `packages/cli/test/doctor.test.ts` enforce this; extend them
  when adding doctor sections.
- **Conservative counting:** when a log shape is ambiguous, undercount and warn.
  Detect-and-warn (suspect-writer heuristic) over guess-and-count, always.
- **All fixtures synthetic.** Never commit real log data, even "scrubbed".

## Release checklist

```
pnpm build && pnpm test && pnpm typecheck
# reconcile against a real corpus if available: trackrecord --json | numbers sane?
# bump versions in packages/*/package.json (lockstep)
git tag vX.Y.Z
pnpm publish -r --access public   # requires B's explicit go-ahead
```

## PARKED — do not build, do not design

Leaderboards + anti-cheat + server-side anything · git commit-survival enrichment
(schema slot `git` reserved) · counting MCP/Bash-written code · dashboards · plugins /
bots / badge surfaces · Turborepo · telemetry of any kind (permanently parked).
