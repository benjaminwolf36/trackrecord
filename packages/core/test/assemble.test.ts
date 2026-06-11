import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { Ajv } from "ajv";
import { analyze } from "../src/assemble.js";
import { corpus, NOW_FOR_TESTS } from "../../../fixtures/manifest.js";

const FIXTURES = resolve(__dirname, "../../../fixtures/projects");
const SCHEMA = JSON.parse(
  readFileSync(resolve(__dirname, "../../../schema/v1.json"), "utf8"),
);

async function run() {
  return analyze({ dir: FIXTURES, now: new Date(NOW_FOR_TESTS) });
}

describe("analyze() over the fixture corpus", () => {
  it("validates against schema/v1.json", async () => {
    const metrics = await run();
    const ajv = new Ajv({ allErrors: true });
    const valid = ajv.validate(SCHEMA, JSON.parse(JSON.stringify(metrics)));
    expect(ajv.errors ?? []).toEqual([]);
    expect(valid).toBe(true);
  });

  it("assembles source info per the manifest", async () => {
    const m = await run();
    expect(m.schemaVersion).toBe("1.0.0");
    expect(m.source.files).toBe(corpus.files);
    expect(m.source.records).toBe(corpus.parsedRecords);
    expect(m.source.ccVersionRange).toEqual(corpus.ccVersionRange);
    expect(m.source.dateRange).toEqual(corpus.dateRange);
    expect(m.git).toEqual({ reserved: true });
  });

  it("matches every manifest output expectation", async () => {
    const m = await run();
    expect(m.output.linesAdded).toEqual(corpus.output.linesAdded);
    expect(m.output.linesRemoved).toEqual(corpus.output.linesRemoved);
    expect(m.output.grossLinesWritten).toBe(corpus.output.grossLinesWritten);
    expect(m.output.filesTouched).toBe(corpus.output.filesTouched);
    expect(m.output.filesCreated).toBe(corpus.output.filesCreated);
    expect(m.output.writes).toBe(corpus.output.writes);
    expect(m.output.edits).toBe(corpus.output.edits);
    expect(m.output.multiEdits).toBe(corpus.output.multiEdits);
    expect(m.output.notebookEdits).toBe(corpus.output.notebookEdits);
    const ts = m.output.byLanguage.find((l) => l.lang === "ts");
    expect(ts?.linesAdded).toBe(corpus.output.tsLinesAdded);
  });

  it("matches manifest activity, delivery, tokens, and warnings", async () => {
    const m = await run();
    expect(m.activity.sessions).toBe(corpus.activity.sessions);
    expect(m.activity.compactions).toBe(corpus.activity.compactions);
    expect(m.delivery).toEqual(corpus.delivery);
    expect(m.tokens.input).toBe(corpus.tokens.input);
    const kinds = Object.fromEntries(
      m.source.parserWarnings.map((w) => [`${w.kind}|${w.type ?? w.tool ?? w.ext ?? w.file}`, w.count]),
    );
    expect(kinds["unknownRecordType|frobnicate"]).toBe(1);
    expect(kinds["suspectedWriteTool|Patch"]).toBe(1);
    expect(kinds["unknownExtension|ipynb"]).toBe(1);
    expect(kinds["unknownExtension|xyz"]).toBe(1);
  });

  it("never leaks snapshot contents anywhere in the result", async () => {
    const m = await run();
    expect(JSON.stringify(m)).not.toContain(corpus.snapshotSentinel);
  });
});

describe("core purity (static)", () => {
  const SRC = resolve(__dirname, "../src");
  const sources = readdirSync(SRC).map((f) => ({
    file: f,
    text: readFileSync(resolve(SRC, f), "utf8"),
  }));

  it("contains no printing, network, or fs-write calls", () => {
    for (const { file, text } of sources) {
      expect(text, file).not.toMatch(/console\./);
      expect(text, file).not.toMatch(/\bfetch\s*\(/);
      expect(text, file).not.toMatch(/node:https?|node:net|node:dns|undici/);
      expect(text, file).not.toMatch(/writeFile|appendFile|createWriteStream|mkdir/);
    }
  });
});
