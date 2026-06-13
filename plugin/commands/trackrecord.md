---
description: Render your Claude Code track record as the Record Book card, inline in chat
---

Render the user's trackrecord card from the plugin's own bundled parser. This plugin
is fully self-contained: zero network calls, no npm/npx, no global install.

1. Run the bundled parser (it reads the user's local Claude Code logs and prints one
   schema-v1 JSON object to stdout):

   ```
   node "${CLAUDE_PLUGIN_ROOT}/bin/trackrecord.cjs" --json
   ```

   If it exits non-zero (e.g. no logs found), show the user its stderr and stop —
   never invent or carry over data.

2. Invoke the `trackrecord-card` skill via the Skill tool to render the card from
   THIS JSON. The skill owns the frozen Record Book template and the slot-computation
   rules — substitute data values only, never redraw or restyle. You already have the
   JSON, so skip the skill's own parser-run step.

3. Fallback (never fail silently): if this session has no inline-HTML/widget tool,
   render the text card instead with

   ```
   node "${CLAUDE_PLUGIN_ROOT}/bin/trackrecord.cjs"
   ```

   and show its box-drawn output in a fenced code block, plus one sentence on why the
   inline card was not shown.

The bundled parser makes zero network calls; so does this command. Do not fetch
anything, and do not fall back to `npx trackrecord` — everything ships inside the plugin.
