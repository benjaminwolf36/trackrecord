---
description: Render your Claude Code track record as the Record Book card, inline in chat
---

Render the user's trackrecord card. Follow these steps exactly:

1. If the `trackrecord-card` skill is available, invoke it via the Skill tool and
   stop — it owns the workflow.
2. Otherwise, read `skills/trackrecord-card/SKILL.md` in this repository and follow
   it exactly: run `npx trackrecord --json` (local-only, zero network), compute the
   slot values per its rules, and render its FROZEN card template verbatim —
   substitute data values only, never redraw or restyle.
3. Fallback (also defined in the skill — never fail silently): if this environment
   cannot render inline HTML widgets, run `npx trackrecord` and show its box-drawn
   text card in a fenced code block; if a `card` subcommand exists, also render the
   PNG and print its absolute path on its own line; state in one sentence why the
   inline card was not shown.
