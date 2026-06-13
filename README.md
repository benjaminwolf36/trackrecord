# trackrecord

**Your Claude Code track record.** Lines added, languages, files, PRs shipped, sessions,
streaks — parsed from the JSONL logs Claude Code already keeps on your machine.

```
npx trackrecord
```

Anthropic ships output analytics — lines accepted, PR tagging — only to **Team and
Enterprise** customers via the Console dashboard. Cost trackers cover what you spent.
Nobody serves individuals rigorous *output* metrics.

**Teams get a dashboard for what Claude Code ships. trackrecord is that, for you —
local, honest, free.**

## Zero network calls

The tool **never touches the network, ever, in any code path**. This is a hard
invariant, not a privacy-policy promise:

- No `fetch`, `http`, `net`, `dns`, `tls`, or `undici` anywhere in the built output —
  enforced by an automated test that scans the published bundles
  ([test/invariants.test.ts](test/invariants.test.ts)).
- No telemetry, permanently. It's on the project's never-list.
- Don't take our word for it: `grep -rE "fetch\(|node:https?|undici" node_modules/trackrecord node_modules/@trackrecord`
  after install, or read the source — it's small on purpose.

Your logs never leave your machine. Even `trackrecord doctor` (the debug report you
might choose to paste into an issue) contains structure only — no code, prompts, or paths.

## Commands

| Command | What it does |
|---|---|
| `npx trackrecord` | Terminal summary of your metrics |
| `npx trackrecord --json` | Full schema object to stdout ([schema/v1.json](schema/v1.json)) |
| `npx trackrecord doctor` | Anonymized structure survey of your logs, for bug reports |

All commands accept `--dir <path>` to override the default `~/.claude/projects/`.

Project folder names are **redacted by default** everywhere they'd appear (`byProject`
shows stable `project-1`, `project-2`… labels) — many folders are named after clients,
and the default output must never surface one. Pass `--show-project-names` to see real
folder names in your own local output.

## Inline card — the Claude Code plugin

Inside Claude Code, `/trackrecord` renders your stats as the **Record Book card**, inline
in chat — no terminal needed. The plugin is **fully self-contained**: it bundles the
parser, makes **zero network calls**, and needs no npm/npx at runtime. On the desktop/web
client you get the rendered card; on clients without inline rendering it falls back to the
box-drawn text card.

**Install from the community marketplace** (after launch — safety-screened, the
trust-signal path):

```
/plugin marketplace add anthropics/claude-plugins-community
/plugin install trackrecord@claude-community
```

**Install from this repo** (self-host or local testing):

```
/plugin marketplace add get-trackrecord/trackrecord
/plugin install trackrecord@trackrecord
```

Or load it for a single session without installing — point Claude Code straight at the
bundled plugin directory:

```
claude --plugin-dir ./plugin
```

After installing, run `/reload-plugins`, then invoke the card. (Plugin slash-commands are
namespaced, so the exact form may be `/trackrecord:trackrecord`; the skill is also
model-invoked, so plain "show my trackrecord" works too.)

### Zero-command auto-load (for anyone who clones this repo)

Commit a `.claude/settings.json` and the plugin registers + enables itself the moment
someone opens the project in Claude Code — no `/plugin` commands at all:

```jsonc
// .claude/settings.json
{
  "extraKnownMarketplaces": {
    "trackrecord": { "source": { "source": "github", "repo": "get-trackrecord/trackrecord" } }
  },
  "enabledPlugins": { "trackrecord@trackrecord": true }
}
```

This is project-scoped — it applies only while working inside the repo, which makes it a
clean "clone and it just works" path for contributors without touching their global setup.

## ⚠ Your logs are evaporating (read this once)

Claude Code **deletes transcripts after ~30 days by default**. Your history — the corpus
this tool reads — is on a rolling 30-day fuse unless you change one setting:

```jsonc
// ~/.claude/settings.json
{ "cleanupPeriodDays": 3650 }
```

This can't recover what's already gone, which is why every trackrecord command warns you
when your corpus looks truncated. It's also why all stats are framed as
**"since \<your first log\>"** — never "this year".

## Methodology

The numbers are conservative by design. When the logs are ambiguous, trackrecord
undercounts rather than guesses. (Anthropic's own Console analytics for teams applies
the same posture — lockfile exclusion, conservative matching — which we take as
validation of the approach.)

**How lines are counted:**

- A `Write` to a new file counts every line. A `Write` over a file we've seen before is
  **diffed against the previous content** — only genuinely new lines count. Rewriting a
  500-line file to change 3 lines counts 3, not 500.
- An `Edit` is a line-diff of `old_string` vs `new_string` (Myers LCS). Added and
  removed are tracked separately.
- `replace_all` edits count **once** — the occurrence count isn't in the log, so we
  deliberately undercount.
- Lockfiles, `*.min.*`, and anything under `dist/`, `build/`, `.next/`, or
  `node_modules/` is bucketed as **generated** and excluded from headline numbers.
- Lines are bucketed by extension: code, docs, config, styles, generated. The headline
  stat everywhere is **lines of code added** — docs and config don't inflate it.
- Blank lines count. Subagent output counts as output (subagent transcripts never count
  as sessions).

**Scope statement:** lines are counted from Claude Code's file tools
(Write/Edit/MultiEdit/NotebookEdit). Code written via Bash heredocs, MCP tools, or
other side channels is out of scope and not counted.

When trackrecord sees an unknown tool that *looks* like it writes files, it warns and
asks you to run `doctor` and open an issue — it never guesses semantics into the count.

**Sessions and activity:** a session is a transcript file with at least one human prompt
and one assistant reply — tool results, meta records, and compaction summaries are never
counted as prompts; assistant turns are deduplicated by request id (streaming partials
don't double-count). Token totals are labeled **"API-equivalent value"**, never "spend" —
they're what the usage would cost at API list prices, not what you paid.

## Doctor

Hit a parsing bug, or numbers that look wrong? Run:

```
npx trackrecord doctor
```

It prints a markdown survey of your corpus *structure* — record types, field names,
tool shapes, version range, anomaly counts. No message text, no code, no prompts, no
paths (only `.jsonl` basenames). Paste it into a
[format report issue](../../issues/new?template=format-report.yml) and the parser gets
fixed for everyone.

## FAQ

**Why is my number smaller than tool X?**
Because we diff. Most counters credit every line of every Write — rewrite a file ten
times and they count it ten times. trackrecord counts the delta, excludes generated
files, and skips side channels it can't verify. Smaller and honest beats big and mushy;
the whole point is a number you can defend.

**Why don't my stats go back further?**
Claude Code deleted your older logs (see the retention section above). Fix
`cleanupPeriodDays` today; the stats grow from here.

**Is this a "Wrapped"?**
No — trackrecord reports delivery metrics over any range, any day of the year,
not a year-in-review. (A shareable ship-card image lands at launch.)

**How does this relate to ccusage / ccwrapped?**
Complementary: **ccusage for cost, trackrecord for output.** ccwrapped is
orthogonal — personality and session vibes vs. delivery metrics. Run all three.

**Why "trackrecord"?**
A track record is a proven history of delivered work — which is exactly what this
shows. No `cc-` prefix soup, and not welded to one tool's name if the scope ever grows.

## Schema

`trackrecord --json` emits a stable, versioned object — contract in
[schema/v1.json](schema/v1.json). Semver: additive fields bump minor, breaking changes
bump major. Build dashboards on it.

## License

MIT. Fonts: JetBrains Mono, in-repo for the upcoming card renderer under the
[SIL OFL](packages/cli/assets/OFL.txt) (font bundling — not fetching — is part of
the zero-network invariant; fonts are not part of the 0.1.0 npm package).
