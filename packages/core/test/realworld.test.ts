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

  it("forked parentUuid DAG across --resume: records dedup by uuid across files — replays never double-count", async () => {
    const dir = dirFor("C--rw-fork"); tmps.push(dir);
    const m = await analyze({ dir, now: NOW });
    expect(m.source.parserWarnings).toEqual([]);
    // fk-u1/fk-a1 are replayed verbatim in the resumed file under the same
    // uuids; uuid dedup (first file wins) plus requestId dedup mean each
    // counts exactly once. Methodology decision approved 2026-06-12.
    expect(m.activity.assistantTurns).toBe(2);
    expect(m.output.linesAdded.code).toBe(2);
    expect(m.activity.humanPrompts).toBe(2);
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
