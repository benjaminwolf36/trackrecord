import { describe, expect, it } from "vitest";
import { countLines, LocEngine } from "../src/loc.js";
import { WarningCollector } from "../src/warnings.js";

const CTX = { project: "demo-app" };

function engine() {
  const warnings = new WarningCollector();
  return { eng: new LocEngine(warnings), warnings };
}

describe("countLines", () => {
  it("counts blank lines, ignores a single trailing newline", () => {
    expect(countLines("a\nb")).toBe(2);
    expect(countLines("a\n\nb\n")).toBe(3);
    expect(countLines("")).toBe(0);
  });
});

describe("LocEngine counting rules", () => {
  it("rule 1: Write to a new path adds all lines and creates a file", () => {
    const { eng } = engine();
    eng.applyToolUse("Write", { file_path: "/p/a.ts", content: "l1\nl2\nl3" }, CTX);
    const r = eng.result(new Map());
    expect(r.linesAdded.code).toBe(3);
    expect(r.filesCreated).toBe(1);
    expect(r.writes).toBe(1);
  });

  it("rule 2: Write over a previously written path counts only the diff", () => {
    const { eng } = engine();
    eng.applyToolUse("Write", { file_path: "/p/a.ts", content: "l1\nl2" }, CTX);
    eng.applyToolUse("Write", { file_path: "/p/a.ts", content: "l1\nl2\nl3" }, CTX);
    const r = eng.result(new Map());
    expect(r.linesAdded.code).toBe(3); // 2 + 1, not 2 + 3
    expect(r.linesRemoved.code).toBe(0);
    expect(r.filesCreated).toBe(1);
    expect(r.grossLinesWritten).toBe(5); // pre-diff gross
  });

  it("rule 3: Edit diffs old vs new, counted separately", () => {
    const { eng } = engine();
    eng.applyToolUse(
      "Edit",
      { file_path: "/p/a.ts", old_string: "const a = 1;", new_string: "const a = 2;\nconst b = 3;" },
      CTX,
    );
    const r = eng.result(new Map());
    expect(r.linesAdded.code).toBe(2);
    expect(r.linesRemoved.code).toBe(1);
  });

  it("rule 3: replace_all is counted once", () => {
    const { eng } = engine();
    eng.applyToolUse(
      "Edit",
      { file_path: "/p/a.ts", old_string: "foo()", new_string: "bar()", replace_all: true },
      CTX,
    );
    const r = eng.result(new Map());
    expect(r.linesAdded.code).toBe(1);
    expect(r.linesRemoved.code).toBe(1);
  });

  it("rule 4: MultiEdit applies rule 3 per edit; NotebookEdit counts new_source by mode", () => {
    const { eng } = engine();
    eng.applyToolUse(
      "MultiEdit",
      {
        file_path: "/p/a.ts",
        edits: [
          { old_string: "let a = 1;", new_string: "let a = 2;" },
          { old_string: "let b = 1;", new_string: "let b = 3;\nlet c = 4;" },
        ],
      },
      CTX,
    );
    eng.applyToolUse(
      "NotebookEdit",
      { notebook_path: "/p/nb.ipynb", cell_id: "c1", edit_mode: "insert", new_source: "x\ny" },
      CTX,
    );
    eng.applyToolUse(
      "NotebookEdit",
      { notebook_path: "/p/nb.ipynb", cell_id: "c2", edit_mode: "delete" },
      CTX,
    );
    const r = eng.result(new Map());
    expect(r.linesAdded.code).toBe(3);
    expect(r.linesRemoved.code).toBe(2);
    expect(r.multiEdits).toBe(1);
    expect(r.notebookEdits).toBe(2);
    expect(r.linesAdded.config).toBe(2); // ipynb -> unknown ext -> config
  });

  it("malformed inputs are skipped and tallied, never thrown", () => {
    const { eng, warnings } = engine();
    eng.applyToolUse("Edit", {}, CTX);
    const r = eng.result(new Map());
    expect(r.edits).toBe(0);
    expect(warnings.get("skippedMalformedRecord")).toHaveLength(1);
  });

  it("generated bucket is tracked but separate from code", () => {
    const { eng } = engine();
    eng.applyToolUse("Write", { file_path: "/p/pnpm-lock.yaml", content: "a\nb\nc\nd" }, CTX);
    const r = eng.result(new Map());
    expect(r.linesAdded.generated).toBe(4);
    expect(r.linesAdded.code).toBe(0);
    expect(r.linesAdded.total).toBe(4);
  });

  it("suspect-writer heuristic warns but never counts", () => {
    const { eng, warnings } = engine();
    const big = ("+filler line\n").repeat(50);
    eng.applyToolUse("Patch", { file_path: "/p/a.ts", patch: big }, CTX);
    const r = eng.result(new Map());
    expect(r.linesAdded.total).toBe(0);
    expect(warnings.get("suspectedWriteTool")).toEqual([
      { kind: "suspectedWriteTool", tool: "Patch", count: 1 },
    ]);
  });

  it("does NOT warn on allowlisted non-writers (ExitPlanMode)", () => {
    const { eng, warnings } = engine();
    // Real ExitPlanMode shape: planFilePath matches /file/, plan is a big multiline string.
    const plan = ("- do the thing\n").repeat(50);
    eng.applyToolUse("ExitPlanMode", { plan, planFilePath: "/p/PLAN.md", allowedPrompts: [] }, CTX);
    expect(eng.result(new Map()).linesAdded.total).toBe(0);
    expect(warnings.get("suspectedWriteTool")).toEqual([]);
  });

  it("does NOT warn on MCP tools — out of scope by spec, never counted", () => {
    const { eng, warnings } = engine();
    const content = ("export const x = 1;\n").repeat(40);
    eng.applyToolUse("mcp__some-server__ctx_execute_file", { file_path: "/p/gen.ts", content }, CTX);
    expect(warnings.get("suspectedWriteTool")).toEqual([]);
  });

  it("STILL warns on an unknown non-MCP write-shaped tool (allowlist is the only escape)", () => {
    const { eng, warnings } = engine();
    const blob = ("line\n").repeat(200);
    eng.applyToolUse("MysteryWriter", { target_file: "/p/a.ts", body: blob }, CTX);
    expect(warnings.get("suspectedWriteTool")).toEqual([
      { kind: "suspectedWriteTool", tool: "MysteryWriter", count: 1 },
    ]);
  });

  it("pathological large rewrites never hang — bounded diff with net-delta fallback", () => {
    const { eng } = engine();
    const mk = (seed: number, n: number) => {
      let s = seed;
      const lines: string[] = [];
      for (let i = 0; i < n; i++) {
        s = (s * 48271) % 2147483647;
        lines.push(`line_${s}`);
      }
      return lines.join("\n");
    };
    const t0 = Date.now();
    // pre-gate path: 30k + 30k lines > MAX_DIFF_LINES
    eng.applyToolUse("Write", { file_path: "/p/huge.ts", content: mk(7, 30_000) }, CTX);
    eng.applyToolUse("Write", { file_path: "/p/huge.ts", content: mk(13, 30_000) }, CTX);
    // maxEditLength path: 8k + 8k dissimilar lines within the gate
    eng.applyToolUse("Write", { file_path: "/p/big.ts", content: mk(17, 8_000) }, CTX);
    eng.applyToolUse("Write", { file_path: "/p/big.ts", content: mk(23, 8_000) }, CTX);
    const elapsed = Date.now() - t0;
    const r = eng.result(new Map());
    // both fallbacks: equal line counts -> net delta 0 beyond the initial writes
    expect(r.linesAdded.code).toBe(38_000); // 30k + 8k initial creates only
    expect(r.linesRemoved.code).toBe(0);
    expect(elapsed).toBeLessThan(15_000); // unbounded Myers took ~174s for the 30k pair alone
  });

  it("aggregates byLanguage and byProject", () => {
    const { eng } = engine();
    eng.applyToolUse("Write", { file_path: "/p/a.ts", content: "1\n2\n3" }, { project: "alpha" });
    eng.applyToolUse("Write", { file_path: "/p/b.md", content: "1" }, { project: "beta" });
    const r = eng.result(new Map([["alpha", 2]]));
    expect(r.byLanguage[0]).toEqual({ lang: "ts", linesAdded: 3, files: 1 });
    expect(r.byProject).toEqual([
      { project: "alpha", linesAdded: 3, sessions: 2 },
      { project: "beta", linesAdded: 1, sessions: 0 },
    ]);
  });
});
