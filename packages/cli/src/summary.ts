import pc from "picocolors";
import { isCodeExt, type Metrics } from "@trackrecord/core";

export function formatCount(n: number): string {
  if (n < 10_000) return n.toLocaleString("en-US");
  // Ascending units: pick the smallest whose rounded value reads < 1000, so 999,999
  // rolls up to "1.0M" rather than printing "1000.0k", and 1e13 reads "11.0T".
  for (const [div, suffix] of [[1e3, "k"], [1e6, "M"], [1e9, "B"], [1e12, "T"]] as const) {
    const r = Math.round((n / div) * 10) / 10;
    if (r < 1000) return `${r}${suffix}`;
  }
  return `${Math.round(n / 1e12)}T`;
}

/** Clamp a value string so it never overruns a card stat panel. */
export function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

/** Suspect-writer warnings the user should know about (spec parser rules). */
export function suspectWriterWarnings(metrics: Metrics): string[] {
  return metrics.source.parserWarnings
    .filter((w) => w.kind === "suspectedWriteTool")
    .map(
      (w) =>
        `⚠ tool ${w.tool} looks like it writes files but isn't counted ` +
        `(${w.count} calls) — run \`trackrecord doctor\` and open an issue.`,
    );
}

/** Inner width of the text card. Fixed so the card prints deterministically everywhere. */
const W = 58;

type Paint = (s: string) => string;
const id: Paint = (s) => s;

/** One bordered card row. Padding is computed on PLAIN text; color applied after. */
function row(left: string, right = "", paintL: Paint = id, paintR: Paint = id): string {
  const reserve = right ? right.length + 2 : 0;
  const l = left.length + reserve > W ? truncate(left, W - reserve) : left;
  const gap = " ".repeat(W - l.length - right.length);
  return `│ ${paintL(l)}${gap}${paintR(right)} │`;
}

const TOP = `┌${"─".repeat(W + 2)}┐`;
const MID = `├${"─".repeat(W + 2)}┤`;
const BOT = `└${"─".repeat(W + 2)}┘`;

/** Share-surface tool names: MCP tools read as "suffix (MCP)". */
function displayTool(name: string, max: number): string {
  const suffix = name.match(/^mcp__<redacted>__(.+)$/)?.[1];
  if (suffix !== undefined) return `${truncate(suffix, max - 5)} (MCP)`;
  return truncate(name, max);
}

/**
 * The text card — the baseline experience for every terminal. Card-shaped:
 * masthead, hero LOC + PRs, ledger rows. Framing is always
 * "since <first-log date>", never "this year".
 */
export function renderSummary(metrics: Metrics): string {
  const { output, delivery, activity, tools, tokens, source } = metrics;
  const since = source.dateRange[0]?.slice(0, 10) ?? "—";
  const until = source.dateRange[1]?.slice(0, 10) ?? "—";

  const hero = (s: string) => pc.bold(pc.green(s));
  const dim: Paint = (s) => pc.dim(s);
  const bold: Paint = (s) => pc.bold(s);

  const ledger = (label: string, value: string, sub = "") =>
    row(label.padEnd(17) + value, sub, (s) => pc.dim(s.slice(0, 17)) + pc.bold(s.slice(17)), dim);

  // code-bucket only: everything on the card sums within the hero (docs shown in its sub-line)
  const topLangs =
    output.byLanguage
      .filter((l) => isCodeExt(l.lang))
      .slice(0, 3)
      .map((l) => `${l.lang} ${formatCount(l.linesAdded)}`)
      .join(" · ") || "—";
  const topTool = tools.builtin[0];
  const totalTokens = tokens.input + tokens.output + tokens.cacheRead + tokens.cacheCreation;

  const lines: string[] = [
    TOP,
    row("TRACKRECORD", `since ${since} → ${until}`, bold, dim),
    row("THE RECORD BOOK · A LEDGER OF SHIPPED WORK", "", dim),
    MID,
    row("LINES OF CODE ADDED", "PULL REQUESTS SHIPPED", dim, dim),
    row(formatCount(output.linesAdded.code), formatCount(delivery.pullRequests), hero, bold),
    row(
      `+${formatCount(output.linesAdded.docs)} docs · ${formatCount(output.linesRemoved.total)} removed`,
      `across ${delivery.repositories} repos`,
      dim,
      dim,
    ),
    MID,
    ledger("top languages", truncate(topLangs, 39)),
    ledger(
      "sessions",
      formatCount(activity.sessions),
      `${activity.activeDays} active days`,
    ),
    ledger(
      "longest streak",
      `${activity.longestStreak}d`,
      activity.currentStreak > 0 ? `current ${activity.currentStreak}d` : "",
    ),
    ledger(
      "top tool",
      topTool ? displayTool(topTool.name, 20) : "—",
      topTool ? `×${formatCount(topTool.count)}` : "",
    ),
    ledger("context ceiling", `${formatCount(activity.compactions)}× hit`),
    ledger(
      "total tokens",
      formatCount(totalTokens),
      `$${tokens.apiEquivalentUsd.toFixed(2)} API-equiv`,
    ),
    MID,
    row("/trackrecord  ·  npx trackrecord", "zero network calls", dim, dim),
    BOT,
  ];
  return lines.join("\n");
}
