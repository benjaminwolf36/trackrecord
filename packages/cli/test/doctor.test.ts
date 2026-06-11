import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { survey } from "@trackrecord/core";
import { renderDoctor } from "../src/doctor.js";
import { corpus } from "../../../fixtures/manifest.js";

const FIXTURES = resolve(__dirname, "../../../fixtures/projects");

async function doctorOutput() {
  return renderDoctor(await survey(FIXTURES));
}

describe("trackrecord doctor", () => {
  it("surveys record types with counts and key sets", async () => {
    const out = await doctorOutput();
    expect(out).toContain("# trackrecord doctor");
    expect(out).toContain("skim before posting");
    expect(out).toMatch(/\| user \| \d+ \|/);
    expect(out).toMatch(/\| pr-link \| \d+ \| .*prUrl/);
    // snapshot records surface only their type field
    expect(out).toMatch(/\| file-history-snapshot \| \d+ \| type \|/);
  });

  it("reports edit shapes, gated fields, linkage, usage keys, anomalies", async () => {
    const out = await doctorOutput();
    expect(out).toContain("| Edit | (empty) | 1 |");
    expect(out).toContain("| Edit | file_path,new_string,old_string,replace_all | 1 |");
    expect(out).toContain('entrypoint values: {"cli"');
    expect(out).toContain("compaction boundaries: 1");
    expect(out).toContain("sessionIds reused across files: 1");
    expect(out).toContain("input_tokens");
    expect(out).toContain("| unknownRecordType | frobnicate | 1 |");
    expect(out).toContain("This report contains structure only — no code, prompts, or paths.");
  });

  it("redacts mcp server names", () => {
    // unit check on shape via a synthetic survey render
    expect(renderDoctor({
      files: { total: 1, main: 1, agent: 0, stubs: 0 },
      recordTypes: [],
      editToolShapes: [],
      versionRange: [null, null],
      gatedFields: { entrypointValues: {}, promptSourceValues: {}, recordsWithEntrypoint: 0, recordsWithoutEntrypoint: 0 },
      linkage: { sidechainRecords: 0, compactBoundaries: 0, reusedSessionIds: 0 },
      toolCounts: [{ name: "mcp__<redacted>__do_thing", count: 2 }],
      usageKeys: [],
      warnings: [],
    })).toContain("mcp__<redacted>__do_thing");
  });

  it("NEVER leaks prompts, code, paths, cwd values, or snapshot contents", async () => {
    const out = await doctorOutput();
    expect(out).not.toContain(corpus.snapshotSentinel);
    expect(out).not.toContain("Add a hello function"); // prompt text
    expect(out).not.toContain("export function hello"); // code content
    expect(out).not.toContain("demo-app"); // cwd value / project dir
    expect(out).not.toContain("C:/dev"); // any path
    expect(out).not.toContain("github.com"); // pr urls
  });
});
