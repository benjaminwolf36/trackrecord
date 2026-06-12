import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { analyze } from "../src/index.js";

/**
 * Fixtures distilled from the 2026-06-12 public-corpus harvest (11 public
 * transcripts) plus the ccdiag-documented corruption modes. All content is
 * synthetic — only the structural triggers were kept.
 */
const REALWORLD = resolve(__dirname, "../../../fixtures/realworld");

function dirFor(project: string): string {
  const tmp = mkdtempSync(join(tmpdir(), "trackrecord-rw-"));
  cpSync(join(REALWORLD, project), join(tmp, project), { recursive: true });
  return tmp;
}

const NOW = new Date("2026-06-12T00:00:00.000Z");
const tmps: string[] = [];
afterAll(() => { for (const t of tmps) rmSync(t, { recursive: true, force: true }); });

describe("real-world structures", () => {
  it("legacy 'summary' records (CC ≤2.0.74) are known and ignored, not warned", async () => {
    const dir = dirFor("C--rw-legacy"); tmps.push(dir);
    const m = await analyze({ dir, now: NOW });
    expect(m.source.parserWarnings).toEqual([]); // no unknownRecordType:summary
    expect(m.output.linesAdded.code).toBe(2);
    expect(m.activity.sessions).toBe(1);
    expect(m.source.ccVersionRange).toEqual(["2.0.71", "2.0.71"]); // below documented range, parses fine
  });

  it("forked parentUuid DAG across --resume: turns dedup by requestId; LOC/prompt replay overcount is KNOWN (pending methodology decision)", async () => {
    const dir = dirFor("C--rw-fork"); tmps.push(dir);
    const m = await analyze({ dir, now: NOW });
    expect(m.source.parserWarnings).toEqual([]);
    // requestId dedup works: fk-r1 appears in both files, counted once
    expect(m.activity.assistantTurns).toBe(2);
    // DOCUMENTED OVERCOUNT: the resumed file replays history, so the fk-r1 Edit
    // (+1 line) and prompt fk-u1 count twice. Ideal: loc=2, prompts=2.
    // Changing this means deduping records by uuid across files — a counting-
    // semantics change that needs an explicit methodology decision. Until then
    // this test pins the current behavior so any drift is loud.
    expect(m.output.linesAdded.code).toBe(3);
    expect(m.activity.humanPrompts).toBe(3);
    expect(m.activity.sessions).toBe(2);
  });

  it("version-boundary truncation (ccdiag): one unparseable line, intact records fully counted", async () => {
    const dir = dirFor("C--rw-trunc"); tmps.push(dir);
    const m = await analyze({ dir, now: NOW });
    const kinds = m.source.parserWarnings.map((w) => w.kind);
    expect(kinds).toEqual(["unparseableLine"]);
    expect(m.output.linesAdded.code).toBe(3); // the intact 2.0.77 Write
    expect(m.activity.assistantTurns).toBe(1); // truncated tr-r2 never counts
    expect(m.source.ccVersionRange).toEqual(["2.0.77", "2.1.0"]); // spans the boundary
  });
});
