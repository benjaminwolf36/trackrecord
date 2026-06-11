import pc from "picocolors";
import type { Metrics } from "@trackrecord/core";

export function formatCount(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("en-US");
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

/** Pretty, compact terminal summary. Framing is always "since <first-log date>". */
export function renderSummary(metrics: Metrics): string {
  const { output, delivery, activity, tools, tokens, source } = metrics;
  const since = source.dateRange[0]?.slice(0, 10) ?? "—";
  const until = source.dateRange[1]?.slice(0, 10) ?? "—";

  const label = (s: string) => pc.dim(s.padEnd(22));
  const hero = (s: string) => pc.bold(pc.green(s));
  const lines: string[] = [];

  lines.push(pc.bold("trackrecord") + pc.dim(" — your Claude Code track record"));
  lines.push(pc.dim(`since ${since} (through ${until})`));
  lines.push("");
  lines.push(
    `  ${label("Lines of code added")}${hero(formatCount(output.linesAdded.code))}` +
      pc.dim(
        `   (+${formatCount(output.linesAdded.docs)} docs, +${formatCount(output.linesAdded.config)} config, ` +
          `+${formatCount(output.linesAdded.styles)} styles · generated excluded)`,
      ),
  );
  lines.push(`  ${label("Lines removed")}${formatCount(output.linesRemoved.total)}`);
  lines.push(
    `  ${label("Files")}${formatCount(output.filesTouched)} touched, ${formatCount(output.filesCreated)} created`,
  );
  lines.push(
    `  ${label("PRs shipped")}${pc.bold(formatCount(delivery.pullRequests))}` +
      pc.dim(` across ${delivery.repositories} repos · ${delivery.branches} branches`),
  );
  lines.push(
    `  ${label("Sessions")}${formatCount(activity.sessions)}` +
      pc.dim(
        ` over ${activity.activeDays} active days · longest streak ${activity.longestStreak}` +
          (activity.currentStreak > 0 ? ` · current ${activity.currentStreak}` : ""),
      ),
  );
  if (activity.subagentRuns > 0) {
    lines.push(`  ${label("Subagent runs")}${formatCount(activity.subagentRuns)}`);
  }
  const topLangs = output.byLanguage.slice(0, 3).map((l) => `${l.lang} ${formatCount(l.linesAdded)}`);
  if (topLangs.length > 0) lines.push(`  ${label("Top languages")}${topLangs.join(pc.dim(" · "))}`);
  const topTool = tools.builtin[0];
  if (topTool) lines.push(`  ${label("Top tool")}${topTool.name} ×${formatCount(topTool.count)}`);
  if (activity.compactions > 0) {
    lines.push(
      `  ${label("Compactions")}${formatCount(activity.compactions)}` +
        pc.dim(" (hit the context ceiling)"),
    );
  }
  const totalTokens = tokens.input + tokens.output + tokens.cacheRead + tokens.cacheCreation;
  lines.push(
    `  ${label("Tokens")}${formatCount(totalTokens)}` +
      pc.dim(` total · API-equivalent value $${tokens.apiEquivalentUsd.toFixed(2)}`),
  );
  lines.push("");
  lines.push(pc.dim("zero network calls — this tool never touches the network. Verify the source."));
  return lines.join("\n");
}
