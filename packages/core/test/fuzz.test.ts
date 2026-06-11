import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { analyze, survey } from "../src/index.js";

/**
 * Parser fuzzing: the parser must survive a hostile corpus with correct
 * warnings and zero crashes. Text-safe cases live in fixtures/hostile
 * (permanent); binary garbage, a 50MB single line, and pathological nesting
 * are generated here deterministically (they don't belong in git).
 */
const HOSTILE_FIXTURES = resolve(__dirname, "../../../fixtures/hostile");
let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "trackrecord-fuzz-"));
  cpSync(HOSTILE_FIXTURES, dir, { recursive: true });
  const gen = join(dir, "C--x-generated");
  mkdirSync(gen, { recursive: true });

  // binary garbage with a .jsonl name
  const garbage = Buffer.alloc(64 * 1024);
  for (let i = 0; i < garbage.length; i++) garbage[i] = (i * 7919 + 13) % 256;
  writeFileSync(join(gen, "0a00f422-0000-4000-8000-00000000000b.jsonl"), garbage);

  // a single ~50MB line (one record, giant string field)
  const big = `{"type":"user","sessionId":"big","big":"${"A".repeat(50 * 1024 * 1024)}"}\n`;
  writeFileSync(join(gen, "0a00f422-0000-4000-8000-00000000000c.jsonl"), big);

  // deeply nested JSON (50k levels) — JSON.parse may throw RangeError; must be caught
  const deep = `{"type":"frobnest","d":${"[".repeat(50_000)}1${"]".repeat(50_000)}}\n`;
  // plus deep nesting INSIDE a known type's ignored field
  const deepKnown = `{"type":"user","sessionId":"deep","x":${"[".repeat(50_000)}1${"]".repeat(50_000)}}\n`;
  writeFileSync(join(gen, "0a00f422-0000-4000-8000-00000000000d.jsonl"), deep + deepKnown);

  // non-UTF8 bytes mid-file, valid records around them
  const mixed = Buffer.concat([
    Buffer.from('{"type":"user","sessionId":"mix","message":{"role":"user","content":[{"type":"text","text":"before"}]},"timestamp":"2026-06-01T00:00:00.000Z"}\n'),
    Buffer.from([0xff, 0xfe, 0x80, 0x81, 0xc3, 0x28, 0x0a]), // invalid UTF-8 line
    Buffer.from('{"type":"assistant","sessionId":"mix","requestId":"mx-1","message":{"role":"assistant","content":[{"type":"text","text":"after"}],"usage":{"input_tokens":3,"output_tokens":2}},"timestamp":"2026-06-01T00:00:01.000Z"}\n'),
  ]);
  writeFileSync(join(gen, "0a00f422-0000-4000-8000-00000000000e.jsonl"), mixed);
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("hostile corpus", () => {
  it("analyze() survives everything with warnings, never throws", async () => {
    const m = await analyze({ dir, now: new Date("2026-06-09T00:00:00.000Z") });

    // wrong-typed usage fields can never produce wrong numbers:
    // Infinity, -5, "many", null all degrade to 0; only the legit 3/2 + 7 count
    expect(m.tokens.input).toBe(10);
    expect(m.tokens.output).toBe(2);
    expect(m.tokens.cacheRead).toBe(0);
    expect(m.tokens.cacheCreation).toBe(0);

    // malformed writer inputs are tallied, not counted, not thrown
    expect(m.output.linesAdded.total).toBe(0);
    const malformed = m.source.parserWarnings.filter((w) => w.kind === "skippedMalformedRecord");
    expect(malformed.length).toBeGreaterThanOrEqual(4); // Write/Edit/MultiEdit null-ish inputs

    // unparseable: truncated line, [1,2,3], "just a string", true, binary garbage,
    // invalid-utf8 line, possibly the deep-nesting lines if JSON.parse gives out
    const unparseable = m.source.parserWarnings
      .filter((w) => w.kind === "unparseableLine")
      .reduce((a, w) => a + w.count, 0);
    expect(unparseable).toBeGreaterThanOrEqual(5);

    // the one legit human prompt with an invalid timestamp still counts as a
    // prompt but contributes no active day
    expect(m.activity.humanPrompts).toBeGreaterThanOrEqual(2); // fuzz file + mixed file
    expect(m.activity.activeDays).toBe(1); // only the mixed file has a valid date

    // wrong-typed pr-link fields never become delivery counts
    expect(m.delivery.pullRequests).toBe(0);

    // version 3 (number) and entrypoint 99 degrade, never appear
    expect(JSON.stringify(m.source.ccVersionRange)).not.toContain("3");
  });

  it("survey() + doctor path survives the same corpus", async () => {
    const s = await survey(dir);
    expect(s.files.total).toBeGreaterThanOrEqual(7);
    // wrong-typed type values are sanitized at collection
    const typeNames = s.recordTypes.map((t) => t.type);
    for (const t of typeNames) expect(t).toMatch(/^[a-z][a-z0-9-]{0,31}$|^<invalid-type>$/);
  });

  it("the 50MB single line parses cleanly — no unparseable warning for that file", async () => {
    const m = await analyze({ dir });
    const bigFileWarnings = m.source.parserWarnings.filter(
      (w) => w.kind === "unparseableLine" && w.file === "0a00f422-0000-4000-8000-00000000000c.jsonl",
    );
    expect(bigFileWarnings).toEqual([]);
    expect(m.source.records).toBeGreaterThanOrEqual(15);
  });
});
