# HARDENING-REPORT — overnight pass, 2026-06-11

Time box: 03:45–07:15 local. **Actual: 03:45–~04:35 — all four tasks completed**, ~2h40m
under budget. 83 tests green (was 74), typecheck clean, every task its own commit, nothing
pushed, nothing published, card/README/PARKED untouched (one bugfix touched `card`'s CLI
*flag parsing*, not the card itself).

Commits, in order:
| Commit | Task |
|---|---|
| `fd59f00` | 1 — doctor privacy red-team fixes (label sanitization) |
| `8564fdc` | 2a — bounded diff hang fix (isolated for one-commit revert) |
| `808a41d` | 2b — parser fuzzing suite + perf |
| `bf45c52` | 3 — dependency pinning + audit |
| `dd9612d` | 4 — `--dir` subcommand bug + cross-platform path tests |

---

## Task 1 — Doctor privacy red-team (complete)

Method: planted `RT_LEAK_*` sentinels in 17 channels (permanent corpus:
`fixtures/redteam/`), rendered doctor, grepped for survivors.

| # | Attack channel | Result before fix |
|---|---|---|
| 1 | Unknown record `type` value carrying a path | **LEAKED** — printed in record-types table + warning |
| 2 | Record field name carrying a path (non-identifier) | **LEAKED** — keys column |
| 3 | Edit-tool input key (non-identifier) | **LEAKED** — edit-shapes table |
| 4 | usage object key (non-identifier) | **LEAKED** — usage-keys section |
| 5 | `entrypoint` value carrying a path | **LEAKED** — gated-fields section |
| 6 | `promptSource` value carrying prompt text | **LEAKED** — gated-fields section |
| 7 | `version` value carrying a path | **LEAKED** — version-range line |
| 8 | Non-MCP tool name carrying a path | **LEAKED** — tool-calls table + suspect warning |
| 9 | MCP tool-name *suffix* carrying content | **LEAKED** — redaction kept suffix verbatim |
| 10 | Prompt text in message content | held (values never collected) |
| 11 | cwd value / project dir name | held |
| 12 | gitBranch with slashes/username | held (branches never surfaced) |
| 13 | Code/paths in tool-input VALUES (incl. unknown tools) | held (only key names collected) |
| 14 | `lastPrompt` / `customTitle` / attachment filename / system content values | held |
| 15 | file-history-snapshot body | held (never parsed) |
| 16 | PR url / repo values | held |
| 17 | `old_string`/`new_string` content | held |

Fix: `packages/core/src/sanitize.ts` — every surfaced label must match its
format-controlled shape or is replaced **wholesale** (never truncate-and-show: a prefix
of a secret is still a secret). Applied at collection in core, so doctor, `--json`
parserWarnings, and the summary top-tool line are all covered. Regression: red-team test
asserts zero sentinels + zero path fragments/usernames/dirnames.

**Residual risk, needs your decision (#1 below):** *identifier-shaped* field names and
MCP tool-name suffixes still print (e.g. a hypothetical key `stripe_live_key_x`).
Blocking them would blind doctor to new field names — its entire purpose — and top-level
keys are serializer-controlled (the only path-keyed maps in the format live inside
snapshot bodies, which are never parsed). I treated identifier-shaped keys as in-scope
format data, not user content.

## Task 2 — Parser fuzzing (complete)

Hostile corpus (committed: `fixtures/hostile/`; generated at test time: binary garbage,
50MB single line, 50k-deep JSON nesting, invalid UTF-8 mid-file):

| Input | Result |
|---|---|
| Wrong-typed values in every load-bearing field (timestamp/sessionId/usage/inputs/message/prUrl/version) | survives; degrades to warnings/zero, never wrong numbers |
| `usage` with `Infinity`, `-5`, `"many"`, `null` | **FIXED**: negatives previously *subtracted* from totals; now rejected like any corrupt value + test |
| Truncated final line, top-level array/string/boolean | warned `unparseableLine`, no crash |
| Empty file, whitespace-only file | parsed as zero records |
| Binary garbage `.jsonl` | every line warned, no crash |
| 50MB single line | parses cleanly, no warning, no memory spike |
| 50k-deep nested JSON | JSON.parse RangeError caught → warned |
| Invalid UTF-8 bytes mid-file | bad line warned, surrounding records parse |

**P1 found and fixed — Myers diff hang (commit `8564fdc`, isolated):** two dissimilar
~30k-line Writes to one path cost **174s measured** (O(size × edit-distance)); a corpus
with repeated large rewrites could stall for hours. Fix: pre-gate at 20k combined lines +
`maxEditLength: 2000` bail inside the diff; both fall back to **net line delta**
(deliberate undercount, the spec's replace_all-counted-once posture). **Measured impact
on the reference corpus: zero** — 79 write-over-write pairs, largest 884 combined lines;
neither bound can trip. Semantics + thresholds are decision #2 below.

**Perf at 10x scale** (`scripts/perf-10x.mjs`): 882,000 records / 900 files →
**52.4s wall, 312MB peak RSS**. Linear scaling, streaming holds (reference corpus ~3s).

## Task 3 — Dependency + supply-chain audit (complete)

- `pnpm audit`: **no known vulnerabilities** (full tree).
- Install scripts (corrected full-tree scan — my first scan had a bug, rechecked):
  **prod tree: zero**. Dev tree: only `esbuild` postinstall (via tsup; blocked by
  pnpm 10's default ignore-scripts posture, and never shipped).
- Prod versions now **pinned exact** (no carets): `diff 9.0.0`, `commander 15.0.0`,
  `picocolors 1.1.1`, `satori 0.26.0`, `@resvg/resvg-js 2.6.2`.

Why each prod dependency exists:
| Dependency | Why |
|---|---|
| `diff` | Myers LCS line-diff — the diff-honest LOC methodology itself |
| `commander` | CLI parsing/subcommands (and tonight's `--dir` fix uses its positional-options mode) |
| `picocolors` | terminal colors, zero-dependency |
| `satori` | HTML/CSS→SVG for the ship card without a headless browser (spec requirement) |
| `@resvg/resvg-js` | SVG→PNG rasterizer; prebuilt napi binaries via optionalDependencies, no install scripts |
| *(transitive, all via satori)* | font parsing (`@shuding/opentype.js`), flexbox layout (`yoga-layout` wasm), CSS parsing (`css-*`, `postcss-value-parser`, `parse-css-color`, `hex-rgb`, `color-name`, `camelize`, `css-to-react-native`), text shaping (`linebreak`, `unicode-trie`, `emoji-regex-xs`, `string.prototype.codepointat`), inflate (`tiny-inflate`, `pako`, `fflate`), `base64-js`, `escape-html` |
| *(transitive, via resvg)* | 12 platform-specific prebuilt binary packages (optional) |

None network-capable; invariants suite re-verified green after pinning.

## Task 4 — Cross-platform paths (complete)

**P1 found and fixed — `--dir` silently ignored on `card` and `doctor`:** the root
command declares its own `--dir`, and commander's default parsing let the root claim
`--dir X` appearing *after* a subcommand. `trackrecord card --dir X` ran against the
DEFAULT directory with exit 0 — a spec violation (`--dir` on all commands) live since
the subcommands were added; suite missed it because tests called the library directly.
Side effect: the "fixture card" sent earlier today was actually rendered from the real
corpus. Fix: `enablePositionalOptions()` + spawn-level regression tests for all three
commands.

Also: nonexistent `--dir` was a silently-empty zero report (typo → "you have no data");
now a one-line error + exit 1, no stack trace. Empty dir remains a valid empty corpus
(exit 0, zeros, `dateRange [null,null]`). New tests: unicode/space/emoji project
directory names, mixed backslash/forward-slash `file_path`s end-to-end, `~` expansion
NOT performed (documented commander/shell behavior — shell expands it on macOS/Linux
before we see it; raw `~/x` on Windows is treated as a literal dir and now errors
clearly).

Note (no change): per-path LOC state is case-sensitive; on case-insensitive filesystems
a log writing `A.ts` then `a.ts` would count 2 created files. Logs record what tools
actually passed; judged not worth a heuristic. Flagged as decision #3 only if you
disagree.

---

## DECISIONS NEEDED

1. **Identifier-shaped names stay visible in doctor** (field names, MCP tool suffixes).
   Recommend: accept — doctor's purpose is surfacing new field names; they're
   serializer-controlled. Alternative: hash unknown-to-fixture keys (cost: useless bug
   reports).
2. **Bounded-diff fallback semantics** (net line delta) **and thresholds** (20k-line
   pre-gate / 2000 maxEditLength). Zero measured impact on reference corpus; only
   pathological inputs affected. Recommend: keep; add one METHODOLOGY sentence to the
   README **at v1 publish** (README untouchable tonight). One revert: `8564fdc`.
3. **Case-sensitivity of path identity** (above). Recommend: leave as-is.

## NOT ATTEMPTED

Nothing — all four listed tasks completed within the time box.

## Corpus impact check

Real-corpus rerun after all fixes: LOC code 59,555 (was 58,840 this morning — delta is
live growth from today's sessions; diff bound verified zero-impact above). Suspect-writer
warnings now empty on the reference corpus (ExitPlanMode/MCP exemptions from the earlier
approved review, not tonight). All other structure criteria unchanged.
