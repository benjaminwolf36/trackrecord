import { describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { analyze } from "@trackrecord/core";
import { renderCardPng } from "../src/card.js";

const run = promisify(execFile);
const BIN = resolve(__dirname, "../dist/index.js");
const REDTEAM = resolve(__dirname, "../../../fixtures/redteam");

describe("card PNG byte-level privacy", () => {
  it("contains no text metadata chunks and no path/username/dirname fragments", async () => {
    const metrics = await analyze({ dir: REDTEAM, now: new Date("2026-06-09T00:00:00.000Z") });
    const png = await renderCardPng(metrics);
    const bytes = png.toString("latin1");

    // PNG text-metadata chunk types — none may exist at all
    for (const chunk of ["tEXt", "iTXt", "zTXt"]) {
      expect(bytes.includes(chunk), `PNG contains ${chunk} chunk`).toBe(false);
    }
    // no path fragments, usernames, project dir names, or planted sentinels
    for (const frag of ["C:/", "C:\\", "/Users/", "/home/", "Benjaminwolf", "RT_LEAK", "RT-LEAK"]) {
      expect(bytes.includes(frag), `PNG bytes contain "${frag}"`).toBe(false);
    }
  });
});

describe("--json output path privacy", () => {
  it("never contains full paths — basenames only, including all warning fields", async () => {
    const { stdout } = await run(process.execPath, [BIN, "--json", "--dir", REDTEAM]);
    // full-path shapes must be absent anywhere in the document
    expect(stdout).not.toMatch(/[A-Za-z]:[\\/]/); // windows drive paths
    expect(stdout).not.toMatch(/\/(?:Users|home)\//); // unix home paths
    expect(stdout).not.toContain("RT-LEAK-DIRNAME"); // the project DIRECTORY name

    const m = JSON.parse(stdout);
    // warning file fields are .jsonl basenames with no separators
    for (const w of m.source.parserWarnings) {
      if (w.file !== undefined) {
        expect(w.file).toMatch(/^[^\\/]+\.jsonl$/);
      }
    }
    // byProject surfaces the cwd BASENAME only (spec-sanctioned), never the prefix
    for (const p of m.output.byProject) {
      expect(p.project).not.toMatch(/[\\/]/);
    }
  });
});
