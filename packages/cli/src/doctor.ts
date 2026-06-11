import type { Survey } from "@trackrecord/core";

/**
 * Renders the anonymized structure survey as markdown, designed to be
 * pasted into a GitHub issue. Structure only — never message text,
 * prompts, code content, paths, or cwd values.
 */
export function renderDoctor(s: Survey): string {
  const lines: string[] = [];
  const section = (title: string) => {
    lines.push("", `## ${title}`, "");
  };

  lines.push("# trackrecord doctor — corpus structure survey");
  lines.push("");
  lines.push("> Includes tool and field names from your setup — skim before posting.");
  lines.push("");
  lines.push(
    `Files: ${s.files.total} total (${s.files.main} main, ${s.files.agent} agent, ` +
      `${s.files.stubs} stubs failing the session rule)`,
  );
  lines.push(`Claude Code version range: ${s.versionRange[0] ?? "unknown"} – ${s.versionRange[1] ?? "unknown"}`);

  section("Record types");
  lines.push("| type | count | field names |");
  lines.push("|---|---|---|");
  for (const t of s.recordTypes) {
    lines.push(`| ${t.type} | ${t.count} | ${t.keys.join(", ")} |`);
  }

  section("Edit-tool input shapes");
  lines.push("| tool | input keys | count |");
  lines.push("|---|---|---|");
  for (const e of s.editToolShapes) {
    lines.push(`| ${e.tool} | ${e.shape} | ${e.count} |`);
  }

  section("Version-gated fields");
  lines.push(
    `entrypoint present on ${s.gatedFields.recordsWithEntrypoint} records, ` +
      `absent on ${s.gatedFields.recordsWithoutEntrypoint}`,
  );
  lines.push(`entrypoint values: ${JSON.stringify(s.gatedFields.entrypointValues)}`);
  lines.push(`promptSource values: ${JSON.stringify(s.gatedFields.promptSourceValues)}`);

  section("Session linkage");
  lines.push(`sidechain records: ${s.linkage.sidechainRecords}`);
  lines.push(`compaction boundaries: ${s.linkage.compactBoundaries}`);
  lines.push(`sessionIds reused across files: ${s.linkage.reusedSessionIds}`);

  section("Tool calls");
  lines.push("| tool | count |");
  lines.push("|---|---|");
  for (const t of s.toolCounts) {
    lines.push(`| ${t.name} | ${t.count} |`);
  }

  section("Usage object keys");
  lines.push(s.usageKeys.join(", ") || "(none seen)");

  section("Anomalies");
  if (s.warnings.length === 0) {
    lines.push("none — every line parsed, every type recognized");
  } else {
    lines.push("| kind | detail | count |");
    lines.push("|---|---|---|");
    for (const w of s.warnings) {
      const detail = w.type ?? w.tool ?? w.ext ?? w.file ?? "";
      lines.push(`| ${w.kind} | ${detail} | ${w.count} |`);
    }
  }

  lines.push("");
  lines.push("---");
  lines.push("This report contains structure only — no code, prompts, or paths.");
  return lines.join("\n");
}
