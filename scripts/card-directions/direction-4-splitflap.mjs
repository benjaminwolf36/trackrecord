// Direction 4 (wildcard): SPLIT-FLAP DEPARTURES BOARD — the shipping record
// as an airport board. Values rendered as individual flap cells (gradient
// seam mid-cell), amber hero, status remarks for flavor.
import { h, statsOf, FONTS, renderToPng, realMetrics, EXTREME } from "./_shared.mjs";

const BG = "#08090b";
const AMBER = "#ffb52e";
const WHITE = "#e9e4d8";
const DIM = "#6b665c";
const SEAM = "linear-gradient(180deg, #26282c 0%, #1b1d21 48%, #101113 52%, #1d1f23 100%)";

function cell(ch, size, color) {
  const w = Math.round(size * 0.82);
  return h(
    "div",
    {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: w,
      height: Math.round(size * 1.42),
      backgroundImage: SEAM,
      borderRadius: Math.max(3, Math.round(size * 0.09)),
      fontSize: size,
      fontWeight: 800,
      color,
      fontFamily: "JetBrains Mono",
      lineHeight: 1,
    },
    ch,
  );
}

function flapWord(text, size, color) {
  const kids = [...text].map((ch) =>
    ch === " "
      ? h("div", { display: "flex", width: Math.round(size * 0.4) })
      : cell(ch, size, color),
  );
  return h("div", { display: "flex", gap: Math.max(2, Math.round(size * 0.09)) }, ...kids);
}

function boardRow(label, value, remark, valueColor = WHITE) {
  return h(
    "div",
    { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0" },
    h("div", { display: "flex", fontSize: 17, letterSpacing: 3, color: DIM, fontFamily: "JetBrains Mono", width: 330 }, label.toUpperCase()),
    flapWord(value.toUpperCase(), 27, valueColor),
    h("div", { display: "flex", fontSize: 15, letterSpacing: 2, color: DIM, fontFamily: "JetBrains Mono", width: 200, justifyContent: "flex-end" }, remark.toUpperCase()),
  );
}

export function build(metrics) {
  const s = statsOf(metrics);
  const langsValue = s.langs.map((l) => l.lang).join("·") || "—";
  const langsRemark = s.langs.map((l) => l.count).join(" / ");

  return h(
    "div",
    { display: "flex", flexDirection: "column", width: "100%", height: "100%", backgroundColor: BG, padding: "30px 50px 24px" },
    // board header
    h(
      "div",
      { display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "2px solid #26282c", paddingBottom: 10 },
      h("div", { display: "flex", fontSize: 24, fontWeight: 800, color: WHITE, fontFamily: "JetBrains Mono", letterSpacing: 4 }, "TRACKRECORD ─ DEPARTURES"),
      h("div", { display: "flex", fontSize: 16, color: DIM, fontFamily: "JetBrains Mono" }, `${s.since} → ${s.until}`),
    ),
    // hero: giant flap row
    h(
      "div",
      { display: "flex", flexDirection: "column", marginTop: 16 },
      h("div", { display: "flex", fontSize: 17, letterSpacing: 4, color: DIM, fontFamily: "JetBrains Mono" }, "LINES OF CODE ADDED"),
      h(
        "div",
        { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 8 },
        flapWord(s.loc.toUpperCase(), 74, AMBER),
        h(
          "div",
          { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 },
          h("div", { display: "flex", fontSize: 17, letterSpacing: 3, color: DIM, fontFamily: "JetBrains Mono" }, "PRS SHIPPED"),
          flapWord(s.prs, 50, WHITE),
        ),
      ),
    ),
    // board rows
    h(
      "div",
      { display: "flex", flexDirection: "column", marginTop: 16, borderTop: "2px solid #26282c", paddingTop: 8 },
      boardRow("top languages", langsValue, langsRemark),
      boardRow("sessions", s.sessions, `${s.activeDays} days active`),
      boardRow("longest streak", `${s.longestStreak}d`, s.currentStreak > 0 ? `current ${s.currentStreak}d` : "—"),
      boardRow("top tool", s.tool.replace(" (MCP)", ""), s.tool.includes("(MCP)") ? `MCP ×${s.toolCount}` : `×${s.toolCount}`, AMBER),
      boardRow("context ceiling hit", `${s.compactions}×`, "on time"),
      boardRow("total tokens", s.tokens, "departed"),
    ),
    // footer
    h(
      "div",
      { display: "flex", justifyContent: "space-between", marginTop: "auto", paddingTop: 10 },
      h("div", { display: "flex", fontSize: 15, color: DIM, fontFamily: "JetBrains Mono" }, "built with Claude Code"),
      h("div", { display: "flex", fontSize: 15, color: DIM, fontFamily: "JetBrains Mono" }, "trackrecord · zero network calls"),
    ),
  );
}

const fonts = [FONTS.mono, FONTS.monoBold];
const mode = process.argv[2] ?? "real";
const out = process.argv[3] ?? `.sent/cards/direction-4-${mode}.png`;
const metrics = mode === "extreme" ? EXTREME : await realMetrics();
console.log(await renderToPng(build(metrics), fonts, out));
