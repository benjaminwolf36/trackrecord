// Generates a synthetic corpus ~10x the reference corpus (880k records across
// 900 files) in a temp dir, runs analyze(), reports wall time + peak RSS.
// Dev tool only — run: node scripts/perf-10x.mjs
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analyze } from "../packages/core/dist/index.js";

const FILES = 900;
const RECORDS_PER_FILE = 980; // ~880k records total
const dir = mkdtempSync(join(tmpdir(), "trackrecord-perf-"));

function record(f, r, sid, ts, proj) {
  const code = ["export const v" + r + " = " + r + ";", "export function fn" + r + "() {", "  return " + r + ";", "}", ""].join("\n");
  const user = { type: "user", uuid: "u" + f + "-" + r, sessionId: sid, timestamp: ts, cwd: proj, gitBranch: "main", version: "2.1.170", entrypoint: "cli", isSidechain: false, userType: "external", message: { role: "user", content: [{ type: "text", text: "prompt " + r + " lorem ipsum dolor sit amet consectetur" }] } };
  const assistant = { type: "assistant", uuid: "a" + f + "-" + r, sessionId: sid, timestamp: ts, requestId: "rq" + f + "-" + r, cwd: proj, gitBranch: "main", version: "2.1.170", isSidechain: false, userType: "external", message: { role: "assistant", model: "claude-fable-5", content: [{ type: "text", text: "ok" }, { type: "tool_use", id: "t" + f + "-" + r, name: "Write", input: { file_path: proj + "/src/f" + (r % 40) + ".ts", content: code } }], usage: { input_tokens: 1200, output_tokens: 340, cache_read_input_tokens: 90000, cache_creation_input_tokens: 4000 } } };
  const toolResult = { type: "user", uuid: "tr" + f + "-" + r, sessionId: sid, timestamp: ts, cwd: proj, isSidechain: false, userType: "external", toolUseResult: { ok: true }, message: { role: "user", content: [{ type: "tool_result", tool_use_id: "t" + f + "-" + r, content: "written" }] } };
  const attachment = { type: "attachment", uuid: "at" + f + "-" + r, sessionId: sid, timestamp: ts, attachment: { type: "file", fileName: "x.png" } };
  return [user, assistant, toolResult, attachment].map((x) => JSON.stringify(x));
}

console.log("generating corpus in", dir);
const genStart = Date.now();
for (let f = 0; f < FILES; f++) {
  const projDir = "C--x-perf-" + (f % 25);
  const proj = "C:/x/perf-" + (f % 25);
  mkdirSync(join(dir, projDir), { recursive: true });
  const sid = "0a00" + String(f).padStart(4, "0") + "-0000-4000-8000-000000000001";
  const lines = [];
  for (let r = 0; r < RECORDS_PER_FILE; r += 4) {
    const ts = new Date(Date.UTC(2026, 0, 1 + (f % 150), 8, 0, r % 60, r % 1000)).toISOString();
    lines.push(...record(f, r, sid, ts, proj));
  }
  writeFileSync(join(dir, projDir, sid + ".jsonl"), lines.join("\n") + "\n");
}
console.log("generated", FILES, "files /", FILES * RECORDS_PER_FILE, "records in", ((Date.now() - genStart) / 1000).toFixed(1) + "s");

const t0 = Date.now();
const m = await analyze({ dir });
const elapsed = (Date.now() - t0) / 1000;
const peakMb = Math.round(process.resourceUsage().maxRSS / 1024);
console.log("analyze(): " + elapsed.toFixed(1) + "s, peak RSS " + peakMb + " MB");
console.log("records=" + m.source.records, "sessions=" + m.activity.sessions, "locCode=" + m.output.linesAdded.code, "tokensIn=" + m.tokens.input);
rmSync(dir, { recursive: true, force: true });
