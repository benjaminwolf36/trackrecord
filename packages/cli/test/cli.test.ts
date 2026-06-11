import { describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { analyze } from "@trackrecord/core";
import { renderSummary, formatCount, suspectWriterWarnings } from "../src/summary.js";
import { retentionNotice } from "../src/retention.js";
import { corpus, NOW_FOR_TESTS } from "../../../fixtures/manifest.js";

const run = promisify(execFile);
const FIXTURES = resolve(__dirname, "../../../fixtures/projects");
const BIN = resolve(__dirname, "../dist/index.js");

async function metrics() {
  return analyze({ dir: FIXTURES, now: new Date(NOW_FOR_TESTS) });
}

describe("trackrecord --json (built binary)", () => {
  it("emits only valid schema JSON on stdout", async () => {
    const { stdout } = await run(process.execPath, [BIN, "--json", "--dir", FIXTURES]);
    const parsed = JSON.parse(stdout); // throws if stdout has anything else
    expect(parsed.schemaVersion).toBe("1.0.0");
    expect(parsed.activity.sessions).toBe(corpus.activity.sessions);
    expect(stdout).not.toContain(corpus.snapshotSentinel);
  });
});

describe("summary view", () => {
  it("leads with linesAdded.code and frames stats as since-first-log", async () => {
    const m = await metrics();
    const text = renderSummary(m);
    expect(text).toContain("since 2026-06-01");
    expect(text).toContain("Lines of code added");
    expect(text).toContain("zero network calls");
    expect(text).not.toContain("this year");
  });

  it("prints the suspect-writer warning line per spec", async () => {
    const m = await metrics();
    const warnings = suspectWriterWarnings(m);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("tool Patch looks like it writes files but isn't counted");
    expect(warnings[0]).toContain("trackrecord doctor");
  });

  it("formats counts compactly", () => {
    expect(formatCount(2_800_000_000)).toBe("2.8B");
    expect(formatCount(1_500_000)).toBe("1.5M");
    expect(formatCount(87_851)).toBe("87.9k");
    expect(formatCount(969)).toBe("969");
  });
});

describe("retention notice", () => {
  it("fires when the corpus spans fewer than ~35 days", async () => {
    const m = await metrics(); // fixture corpus spans 7 days
    const notice = retentionNotice(m);
    expect(notice).toContain("Your logs only go back to 2026-06-01");
    expect(notice).toContain("cleanupPeriodDays");
  });

  it("stays quiet for long-spanning corpora", async () => {
    const m = await metrics();
    m.source.dateRange = ["2025-06-01T00:00:00.000Z", "2026-06-08T00:00:00.000Z"];
    expect(retentionNotice(m)).toBeNull();
  });
});
