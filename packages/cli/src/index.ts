import { homedir } from "node:os";
import { join } from "node:path";
import { Command } from "commander";
import { analyze } from "@trackrecord/core";
import { renderSummary, suspectWriterWarnings } from "./summary.js";
import { retentionNotice } from "./retention.js";

const DEFAULT_DIR = join(homedir(), ".claude", "projects");

const program = new Command();

program
  .name("trackrecord")
  .description("Your Claude Code track record — local, honest, free. Zero network calls.")
  .option("--json", "emit the full schema object to stdout")
  .option("--dir <path>", "override the projects directory", DEFAULT_DIR)
  .action(async (opts: { json?: boolean; dir: string }) => {
    const metrics = await analyze({ dir: opts.dir });
    const notice = retentionNotice(metrics);
    if (opts.json) {
      // stdout carries ONLY the schema object; notices go to stderr
      process.stdout.write(`${JSON.stringify(metrics, null, 2)}\n`);
      if (notice) process.stderr.write(`${notice}\n`);
      return;
    }
    process.stdout.write(`${renderSummary(metrics)}\n`);
    for (const warning of suspectWriterWarnings(metrics)) {
      process.stdout.write(`${warning}\n`);
    }
    if (notice) process.stdout.write(`\n${notice}\n`);
  });

program.parseAsync().catch((err: unknown) => {
  process.stderr.write(`trackrecord: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
