// Direction 3: BROADSHEET — financial-print market page. Dense, typographic,
// monochrome + one crimson accent on the market arrows. Spectral masthead,
// Plex Condensed data columns, vertical column rules.
import { h, statsOf, FONTS, renderToPng, realMetrics, EXTREME } from "./_shared.mjs";

const PAPER = "#fbfaf6";
const INK = "#15130f";
const GRAY = "#6e6a60";
const RULE = "#cdc8bb";
const CRIMSON = "#bb1f1f";

function agate(label, value, sub) {
  return h(
    "div",
    { display: "flex", flexDirection: "column", borderBottom: `1px solid ${RULE}`, padding: "9px 0 10px" },
    h("div", { display: "flex", fontSize: 14, letterSpacing: 2, color: GRAY, fontFamily: "Plex Condensed" }, label.toUpperCase()),
    h(
      "div",
      { display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 2 },
      h("div", { display: "flex", fontSize: 34, fontWeight: 700, fontFamily: "Plex Condensed", lineHeight: 1 }, value),
      ...(sub ? [h("div", { display: "flex", fontSize: 14, color: GRAY, fontFamily: "Plex Condensed" }, sub)] : []),
    ),
  );
}

export function build(metrics) {
  const s = statsOf(metrics);

  return h(
    "div",
    { display: "flex", flexDirection: "column", width: "100%", height: "100%", backgroundColor: PAPER, color: INK, padding: "26px 50px 22px" },
    // masthead: thick rule, centered title, thin rule, dateline
    h("div", { display: "flex", borderTop: `5px solid ${INK}` }),
    h("div", { display: "flex", borderTop: `1px solid ${INK}`, marginTop: 2 }),
    h(
      "div",
      { display: "flex", justifyContent: "center", padding: "6px 0 4px" },
      h("div", { display: "flex", fontSize: 54, fontWeight: 800, fontFamily: "Spectral", letterSpacing: 2 }, "THE TRACK RECORD"),
    ),
    h(
      "div",
      { display: "flex", justifyContent: "space-between", borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}`, padding: "5px 4px", marginTop: 2 },
      h("div", { display: "flex", fontSize: 15, fontFamily: "Plex Condensed", letterSpacing: 2 }, "SHIPPED-WORK EDITION"),
      h("div", { display: "flex", fontSize: 15, fontFamily: "Plex Condensed", letterSpacing: 2 }, `${s.since} — ${s.until}`),
      h("div", { display: "flex", fontSize: 15, fontFamily: "Plex Condensed", letterSpacing: 2 }, "ZERO NETWORK CALLS"),
    ),
    // body: three columns with rules
    h(
      "div",
      { display: "flex", flexGrow: 1, marginTop: 14, gap: 0 },
      // col 1: the quote board
      h(
        "div",
        { display: "flex", flexDirection: "column", flexGrow: 1.45, flexBasis: 0, paddingRight: 28, justifyContent: "center" },
        h("div", { display: "flex", fontSize: 16, letterSpacing: 3, color: GRAY, fontFamily: "Plex Condensed" }, "LINES OF CODE ADDED"),
        h(
          "div",
          { display: "flex", alignItems: "baseline", gap: 14 },
          h("div", { display: "flex", fontSize: 150, fontWeight: 700, fontFamily: "Plex Condensed", lineHeight: 1 }, s.loc),
          h("div", { display: "flex", fontSize: 54, color: CRIMSON, fontFamily: "Plex Condensed" }, "▲"),
        ),
        h(
          "div",
          { display: "flex", alignItems: "baseline", gap: 14, marginTop: 22 },
          h("div", { display: "flex", fontSize: 84, fontWeight: 700, fontFamily: "Plex Condensed", lineHeight: 1 }, s.prs),
          h(
            "div",
            { display: "flex", flexDirection: "column" },
            h("div", { display: "flex", fontSize: 30, color: CRIMSON, fontFamily: "Plex Condensed" }, "▲"),
            h("div", { display: "flex", fontSize: 16, letterSpacing: 2, color: GRAY, fontFamily: "Plex Condensed" }, "PRS SHIPPED"),
          ),
        ),
      ),
      // col 2: the tape — languages + activity
      h(
        "div",
        { display: "flex", flexDirection: "column", flexGrow: 1, flexBasis: 0, borderLeft: `1px solid ${INK}`, paddingLeft: 24, paddingRight: 24 },
        h("div", { display: "flex", fontSize: 15, letterSpacing: 3, fontWeight: 700, fontFamily: "Plex Condensed", borderBottom: `2px solid ${INK}`, paddingBottom: 4 }, "THE TAPE"),
        ...s.langs.map((l) =>
          h(
            "div",
            { display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: `1px solid ${RULE}`, padding: "8px 0" },
            h("div", { display: "flex", fontSize: 24, fontWeight: 700, fontFamily: "Plex Condensed" }, l.lang.toUpperCase()),
            h("div", { display: "flex", fontSize: 24, fontFamily: "Plex Condensed" }, l.count),
          ),
        ),
        agate("sessions", s.sessions, `${s.activeDays} active days`),
        agate("longest streak", `${s.longestStreak}d`, s.currentStreak > 0 ? `cur ${s.currentStreak}d` : undefined),
      ),
      // col 3: operations
      h(
        "div",
        { display: "flex", flexDirection: "column", flexGrow: 1, flexBasis: 0, borderLeft: `1px solid ${INK}`, paddingLeft: 24 },
        h("div", { display: "flex", fontSize: 15, letterSpacing: 3, fontWeight: 700, fontFamily: "Plex Condensed", borderBottom: `2px solid ${INK}`, paddingBottom: 4 }, "OPERATIONS"),
        agate("top tool", s.tool, s.toolCount ? `×${s.toolCount}` : undefined),
        agate("context ceiling hit", `${s.compactions}×`),
        agate("total tokens", s.tokens),
        h("div", { display: "flex", fontSize: 14, color: GRAY, fontFamily: "Plex Condensed", marginTop: "auto", lineHeight: 1.5 }, "All figures parsed locally from Claude Code transcripts. Conservative by design: diffs, not gross writes."),
      ),
    ),
    // footer
    h(
      "div",
      { display: "flex", justifyContent: "space-between", borderTop: `2px solid ${INK}`, paddingTop: 8, marginTop: 12 },
      h("div", { display: "flex", fontSize: 15, fontFamily: "Plex Condensed", letterSpacing: 1 }, "built with Claude Code"),
      h("div", { display: "flex", fontSize: 15, fontFamily: "Plex Condensed", letterSpacing: 1 }, "trackrecord · zero network calls"),
    ),
  );
}

const fonts = [FONTS.cond, FONTS.condBold, FONTS.serifBlack, FONTS.mono, FONTS.monoBold];
const mode = process.argv[2] ?? "real";
const out = process.argv[3] ?? `.sent/cards/direction-3-${mode}.png`;
const metrics = mode === "extreme" ? EXTREME : await realMetrics();
console.log(await renderToPng(build(metrics), fonts, out));
