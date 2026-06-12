---
name: trackrecord-card
description: Render the user's Claude Code track record as the Record Book card, inline in chat. Trigger on "trackrecord", "npx trackrecord", "track record", "show my track record", "my shipping record", or any equivalent request for the user's Claude Code output stats.
---

# trackrecord — Record Book card

Render the user's local Claude Code metrics as the **Record Book card**, inline in
chat. The card design below is **approved and frozen**: render the template
verbatim, substitute the `{{VALUE}}` slots only. Never redraw, reinterpret,
restyle, reorder, or "improve" the design. If a rendered card differs from this
template in anything but the data values, that is a bug.

## Workflow

1. Run the CLI (local-only, zero network calls; project names are redacted by default):

   ```
   npx trackrecord --json
   ```

   stdout is a single JSON object (schema v1). If the command fails because no
   logs exist, show the user its stderr message and stop — do not invent data.

2. Compute the slot values from the JSON (rules below).

3. **If an inline-HTML/widget rendering tool is available in this session**
   (e.g. a `show_widget` / visualize tool): render the template under
   "The card template", with slots substituted, as a single widget. Output no
   other prose besides one short sentence.

4. **Fallback — REQUIRED, never fail silently.** If no widget/inline-HTML tool
   is available:
   - Run `npx trackrecord` (no flags) and show its output in a fenced code block —
     that is the text card, the official fallback experience.
   - If this trackrecord version supports `trackrecord card` (check `--help`),
     also render the PNG with `npx trackrecord card --out trackrecord-card.png`
     and print the absolute output path on its own line so the user can open it.
   - Tell the user in one sentence why the inline card was not shown
     ("this environment can't render inline widgets").

## Slot computation rules

All values come from `npx trackrecord --json`. Number formatting (`fmt`):
- n < 10,000 → locale string with commas (e.g. `3,430`)
- else divide by 1e3/1e6/1e9/1e12 until the rounded value is < 1000, one decimal,
  drop a trailing `.0`, suffix `k`/`M`/`B`/`T` (e.g. `60.4k`, `2.8B`, `11T`)

| Slot | Source |
|---|---|
| `{{DATE_FROM}}` / `{{DATE_TO}}` | `source.dateRange[0]` / `[1]`, first 10 chars (YYYY-MM-DD); `—` if null |
| `{{LOC}}` | `fmt(output.linesAdded.code)` — the CODE bucket, never `.total` |
| `{{PRS}}` | `fmt(delivery.pullRequests)` |
| `{{LANGS}}` | top 3 entries of `output.byLanguage` whose `lang` is a CODE extension (list below), as `lang fmt(linesAdded)`, joined with ` · `; `—` if none |
| `{{SESSIONS}}` | `fmt(activity.sessions)` |
| `{{ACTIVE_DAYS}}` | `activity.activeDays` locale string |
| `{{STREAK}}` | `activity.longestStreak` + `d` |
| `{{CURRENT_STREAK}}` | `current {activity.currentStreak}d`, or empty string if 0 |
| `{{TOOL}}` | `tools.builtin[0].name`; if it matches `mcp__<redacted>__SUFFIX` display `SUFFIX (MCP)`; truncate to ~16 chars with `…`; `—` if absent |
| `{{TOOL_COUNT}}` | `×{fmt(tools.builtin[0].count)} calls` |
| `{{COMPACTIONS}}` | `fmt(activity.compactions)` + `×` |
| `{{TOKENS}}` | `fmt(tokens.input + tokens.output + tokens.cacheRead + tokens.cacheCreation)` |

CODE extensions (the code bucket — this list is part of the contract):
`ts tsx js jsx mjs cjs py rb go rs java kt swift c cc cpp h hpp cs php sql sh bash zsh ps1 vue svelte astro`

## The card template (FROZEN — substitute slots only)

```html
<h2 class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);">Trackrecord Record Book card: {{LOC}} lines of code added, {{PRS}} pull requests shipped; top languages {{LANGS}}; {{SESSIONS}} sessions over {{ACTIVE_DAYS}} active days; longest streak {{STREAK}}; top tool {{TOOL}} {{TOOL_COUNT}}; context ceiling hit {{COMPACTIONS}}; {{TOKENS}} total tokens. Dated {{DATE_FROM}} to {{DATE_TO}}.</h2>
<div style="background:#f4efe4;color:#211c14;font-family:var(--font-mono);padding:30px 40px 22px;border-radius:var(--border-radius-lg);border:0.5px solid var(--color-border-tertiary);">
  <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:3px solid #211c14;padding-bottom:6px;">
    <div style="font-family:var(--font-serif);font-weight:500;font-size:40px;letter-spacing:2px;">TRACKRECORD</div>
    <div style="font-size:14px;color:#7d7257;letter-spacing:2px;">{{DATE_FROM}} — {{DATE_TO}}</div>
  </div>
  <div style="font-size:12px;letter-spacing:4px;color:#7d7257;border-bottom:1px solid #211c14;padding:4px 0 6px;">THE RECORD BOOK · A LEDGER OF SHIPPED WORK</div>

  <div style="display:flex;justify-content:space-between;align-items:flex-end;padding:16px 0 14px;border-bottom:1px solid #b9ac8d;">
    <div>
      <div style="font-size:13px;letter-spacing:3px;color:#7d7257;">LINES OF CODE ADDED</div>
      <div style="font-family:var(--font-serif);font-weight:500;font-size:84px;line-height:0.95;color:#8e2a1d;">{{LOC}}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:13px;letter-spacing:3px;color:#7d7257;">PULL REQUESTS SHIPPED</div>
      <div style="font-family:var(--font-serif);font-weight:500;font-size:84px;line-height:0.95;">{{PRS}}</div>
    </div>
  </div>

  <div style="display:flex;gap:48px;">
    <div style="flex:1;">
      <div style="border-bottom:1px solid #b9ac8d;padding:9px 0 10px;">
        <div style="font-size:13px;letter-spacing:3px;color:#7d7257;">TOP LANGUAGES</div>
        <div style="font-family:var(--font-serif);font-weight:500;font-size:22px;margin-top:4px;">{{LANGS}}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #b9ac8d;padding:9px 0 10px;">
        <div><div style="font-size:13px;letter-spacing:3px;color:#7d7257;">SESSIONS</div><div style="font-size:12px;color:#7d7257;margin-top:2px;">{{ACTIVE_DAYS}} active days</div></div>
        <div style="font-family:var(--font-serif);font-weight:500;font-size:34px;">{{SESSIONS}}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;padding:9px 0 4px;">
        <div><div style="font-size:13px;letter-spacing:3px;color:#7d7257;">LONGEST STREAK</div><div style="font-size:12px;color:#7d7257;margin-top:2px;">{{CURRENT_STREAK}}</div></div>
        <div style="font-family:var(--font-serif);font-weight:500;font-size:34px;">{{STREAK}}</div>
      </div>
    </div>
    <div style="flex:1;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #b9ac8d;padding:9px 0 10px;">
        <div><div style="font-size:13px;letter-spacing:3px;color:#7d7257;">TOP TOOL</div><div style="font-size:12px;color:#7d7257;margin-top:2px;">{{TOOL_COUNT}}</div></div>
        <div style="font-family:var(--font-serif);font-weight:500;font-size:34px;">{{TOOL}}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid #b9ac8d;padding:9px 0 10px;">
        <div style="font-size:13px;letter-spacing:3px;color:#7d7257;">CONTEXT CEILING HIT</div>
        <div style="font-family:var(--font-serif);font-weight:500;font-size:34px;">{{COMPACTIONS}}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;padding:9px 0 4px;">
        <div style="font-size:13px;letter-spacing:3px;color:#7d7257;">TOTAL TOKENS</div>
        <div style="font-family:var(--font-serif);font-weight:500;font-size:34px;color:#8e2a1d;">{{TOKENS}}</div>
      </div>
    </div>
  </div>

  <div style="font-family:var(--font-serif);font-size:12px;color:#7d7257;padding-top:14px;">All figures parsed locally from Claude Code transcripts. Conservative by design: diffs, not gross writes.</div>
  <div style="display:flex;justify-content:space-between;padding-top:6px;font-size:13px;color:#7d7257;">
    <div style="font-family:var(--font-serif);">built with Claude Code</div>
    <div>trackrecord · zero network calls</div>
  </div>
</div>
```

## Hard rules

- Template is verbatim — colors `#f4efe4 #211c14 #b9ac8d #7d7257 #8e2a1d`, sizes,
  spacing, masthead order (TRACKRECORD leads; ledger line is the subtitle),
  methodology footnote: all frozen.
- Data values come ONLY from the CLI output of this run. Never estimate, carry
  over, or fabricate a number.
- Never show project folder names unless the user explicitly ran with
  `--show-project-names` themselves (the card has no project slot — keep it that way).
- The CLI makes zero network calls; so does this skill. Do not fetch anything.
