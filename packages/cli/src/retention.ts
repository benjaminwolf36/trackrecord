import type { Metrics } from "@trackrecord/core";

const RETENTION_WINDOW_DAYS = 35;

/**
 * Claude Code deletes transcripts after ~30 days by default
 * (cleanupPeriodDays). If the corpus span suggests the user is losing
 * history, every command surfaces this notice (spec: retention awareness).
 */
export function retentionNotice(metrics: Metrics): string | null {
  const [first, last] = metrics.source.dateRange;
  if (first === null || last === null) return null;
  const spanDays = (new Date(last).getTime() - new Date(first).getTime()) / 86_400_000;
  if (spanDays >= RETENTION_WINDOW_DAYS) return null;
  const firstDay = first.slice(0, 10);
  return (
    `Your logs only go back to ${firstDay} — Claude Code deletes older sessions ` +
    `by default. Add \`cleanupPeriodDays\` to ~/.claude/settings.json to keep ` +
    `your history (this can't recover what's gone).`
  );
}
