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

1. Get the metrics JSON. If the `/trackrecord` command already ran the bundled
   parser and handed you its JSON, use that — do not re-run anything. Otherwise run
   the plugin's self-contained parser (local-only, zero network, no npm; project
   names are redacted by default):

   ```
   node "${CLAUDE_PLUGIN_ROOT}/bin/trackrecord.cjs" --json
   ```

   stdout is a single JSON object (schema v1). If it fails because no logs exist,
   show the user its stderr message and stop — do not invent data.

2. Compute the slot values from the JSON (rules below).

3. **If an inline-HTML/widget rendering tool is available in this session**
   (e.g. a `show_widget` / visualize tool): render the template under
   "The card template", with slots substituted, as a single widget. Output no
   other prose besides one short sentence.

4. **Fallback — REQUIRED, never fail silently.** If no widget/inline-HTML tool
   is available:
   - Run the bundled parser with no flags and show its output in a fenced code block —
     that box-drawn text card is the official fallback experience:

     ```
     node "${CLAUDE_PLUGIN_ROOT}/bin/trackrecord.cjs"
     ```
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
<h2 class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);">Trackrecord card: {{LOC}} lines of code added, {{PRS}} pull requests shipped; top languages {{LANGS}}; {{SESSIONS}} sessions, {{ACTIVE_DAYS}} active days, longest streak {{STREAK}}; top tool {{TOOL}} {{TOOL_COUNT}}; context ceiling hit {{COMPACTIONS}}; {{TOKENS}} total tokens. Dated {{DATE_FROM}} to {{DATE_TO}}. Zero network calls, local parser only. Run with /trackrecord in Claude Code, or npx trackrecord in a terminal.</h2>
<div style="container-type:inline-size;background:#f4efe4;color:#211c14;font-family:var(--font-mono);padding:30px 40px 24px;border-radius:var(--border-radius-lg);border:0.5px solid var(--color-border-tertiary);">

  <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #211c14;padding-bottom:8px;">
    <div style="font-family:var(--font-serif);font-weight:500;font-size:clamp(22px,7.4cqw,42px);letter-spacing:1px;">TRACKRECORD</div>
    <div style="font-size:clamp(11px,2.3cqw,13px);color:#5a5240;letter-spacing:1px;white-space:nowrap;">{{DATE_FROM}} → {{DATE_TO}}</div>
  </div>

  <div style="display:flex;justify-content:space-between;align-items:flex-end;padding:20px 0 18px;border-bottom:1px solid #c4b89a;">
    <div>
      <div style="font-size:14px;letter-spacing:1px;color:#5a5240;">LINES OF CODE ADDED</div>
      <div style="font-family:var(--font-serif);font-weight:500;font-size:clamp(34px,14cqw,82px);line-height:0.9;color:#8e2a1d;margin-top:6px;">{{LOC}}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:14px;letter-spacing:1px;color:#5a5240;">PULL REQUESTS SHIPPED</div>
      <div style="font-family:var(--font-serif);font-weight:500;font-size:clamp(34px,14cqw,82px);line-height:0.9;margin-top:6px;">{{PRS}}</div>
    </div>
  </div>

  <div style="display:flex;justify-content:space-between;align-items:baseline;padding:13px 0;border-bottom:1px solid #c4b89a;">
    <div style="font-size:14px;letter-spacing:1px;color:#5a5240;">TOP LANGUAGES</div>
    <div style="font-family:var(--font-mono);font-weight:500;font-size:clamp(13px,3cqw,17px);">{{LANGS}}</div>
  </div>

  <div style="display:flex;gap:48px;padding-top:6px;">
    <div style="flex:1;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;height:56px;border-bottom:1px solid #d8cfb8;"><div style="font-size:14px;letter-spacing:1px;color:#5a5240;">SESSIONS</div><div style="font-family:var(--font-mono);font-weight:500;font-size:clamp(18px,5cqw,28px);">{{SESSIONS}}</div></div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;height:56px;border-bottom:1px solid #d8cfb8;"><div style="font-size:14px;letter-spacing:1px;color:#5a5240;">ACTIVE DAYS</div><div style="font-family:var(--font-mono);font-weight:500;font-size:clamp(18px,5cqw,28px);">{{ACTIVE_DAYS}}</div></div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;height:56px;"><div><div style="font-size:14px;letter-spacing:1px;color:#5a5240;">LONGEST STREAK</div><div style="font-size:12px;color:#7a7058;margin-top:3px;">{{CURRENT_STREAK}}</div></div><div style="font-family:var(--font-mono);font-weight:500;font-size:clamp(18px,5cqw,28px);">{{STREAK}}</div></div>
    </div>
    <div style="flex:1;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;height:56px;border-bottom:1px solid #d8cfb8;"><div><div style="font-size:14px;letter-spacing:1px;color:#5a5240;">TOP TOOL</div><div style="font-size:12px;color:#7a7058;margin-top:3px;">{{TOOL_COUNT}}</div></div><div style="font-family:var(--font-mono);font-weight:500;font-size:clamp(18px,5cqw,28px);">{{TOOL}}</div></div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;height:56px;border-bottom:1px solid #d8cfb8;"><div style="font-size:14px;letter-spacing:1px;color:#5a5240;">CONTEXT CEILING HIT</div><div style="font-family:var(--font-mono);font-weight:500;font-size:clamp(18px,5cqw,28px);">{{COMPACTIONS}}</div></div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;height:56px;"><div style="font-size:14px;letter-spacing:1px;color:#5a5240;">TOTAL TOKENS</div><div style="font-family:var(--font-mono);font-weight:500;font-size:clamp(18px,5cqw,28px);">{{TOKENS}}</div></div>
    </div>
  </div>

  <div style="border-top:2px solid #211c14;margin-top:8px;padding-top:13px;font-size:11px;color:#7a7058;letter-spacing:0.2px;display:flex;justify-content:space-between;align-items:baseline;">
    <div><span style="color:#8e2a1d;">/trackrecord</span> in Claude Code &nbsp;·&nbsp; <span style="color:#8e2a1d;">npx trackrecord</span></div>
    <div style="white-space:nowrap;">zero network calls &nbsp;·&nbsp; local parser only</div>
  </div>

</div>
```

## Hard rules

- Template is verbatim — colors `#f4efe4 #211c14 #5a5240 #7a7058 #c4b89a #d8cfb8 #8e2a1d`,
  the `clamp()`/`container-type` responsive sizing, spacing, single-line masthead
  (TRACKRECORD leads; date range right), serif used ONLY for the wordmark and the
  two hero numbers (LOC + PRS), mono for every label and secondary number, the red
  accent on the LOC hero and the two footer commands only, the 2px bookend rules
  (top of card + above footer), and the single-line footer (install/run on the
  left, `zero network calls · local parser only` on the right): all frozen.
- Data values come ONLY from the CLI output of this run. Never estimate, carry
  over, or fabricate a number.
- Never show project folder names unless the user explicitly ran with
  `--show-project-names` themselves (the card has no project slot — keep it that way).
- The CLI makes zero network calls; so does this skill. Do not fetch anything.
