// DEV ONLY — public-corpus harvest. Downloads public Claude Code JSONL
// transcripts (GitHub code search + simonw's gists) OUTSIDE the repo, runs
// the summary path (analyze) and doctor path (survey) against each, and
// reports crashes, non-finite numbers, unknown structure, and out-of-range
// CC versions. Raw transcripts are NEVER committed; failures get distilled
// into synthetic fixtures by hand per MAINTENANCE.md.
//
// Usage: node scripts/dev/harvest-public-corpus.mjs [--skip-download]
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readdirSync, existsSync, statSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analyze, survey } from "../../packages/core/dist/index.js";

const ROOT = join(tmpdir(), "trackrecord-harvest");
const RAW = join(ROOT, "raw");
const MAX_FILES = 50;
const MAX_BYTES = 20 * 1024 * 1024;
const VERSION_RANGE = ["2.0.77", "2.1.170"];

const report = [];
const log = (s) => { console.log(s); report.push(s); };

function gh(args, opts = {}) {
  return execFileSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });
}

// ---------- download ----------
function download() {
  mkdirSync(RAW, { recursive: true });
  let n = readdirSync(RAW).length;
  log(`## Download (existing: ${n})`);

  // 1) GitHub code search for transcript-shaped jsonl
  try {
    const res = JSON.parse(
      gh(["search", "code", '"parentUuid" "isSidechain"', "--extension", "jsonl",
          "--limit", "50", "--json", "repository,path"]),
    );
    log(`code search hits: ${res.length}`);
    for (const hit of res) {
      if (n >= MAX_FILES) break;
      const repo = hit.repository.fullName ?? hit.repository.nameWithOwner;
      try {
        const raw = gh(["api", `repos/${repo}/contents/${hit.path}`,
                        "-H", "Accept: application/vnd.github.raw"]);
        if (raw.length === 0 || raw.length > MAX_BYTES) continue;
        writeFileSync(join(RAW, `gh-${n}.jsonl`), raw);
        log(`  saved gh-${n}.jsonl  (${repo}/${hit.path}, ${raw.length}b)`);
        n++;
      } catch (e) { log(`  SKIP ${repo}/${hit.path}: ${String(e.message).slice(0, 80)}`); }
    }
  } catch (e) { log(`code search failed: ${String(e.message).slice(0, 200)}`); }

  // 2) simonw's gists (claude-code-transcripts)
  try {
    const gists = JSON.parse(gh(["api", "users/simonw/gists", "--paginate"]));
    for (const g of gists) {
      if (n >= MAX_FILES) break;
      for (const [fname, f] of Object.entries(g.files ?? {})) {
        if (n >= MAX_FILES) break;
        if (!fname.endsWith(".jsonl") && !fname.endsWith(".json")) continue;
        try {
          const raw = gh(["api", f.raw_url.replace("https://gist.githubusercontent.com", "")],
            { env: { ...process.env } });
          if (!raw.includes("parentUuid")) continue;
          writeFileSync(join(RAW, `gist-${n}.jsonl`), raw);
          log(`  saved gist-${n}.jsonl  (gist ${g.id}/${fname})`);
          n++;
        } catch { /* raw_url is a different host; fall back to curl */
          try {
            const raw = execFileSync("curl", ["-sL", f.raw_url], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
            if (!raw.includes("parentUuid") || raw.length > MAX_BYTES) continue;
            writeFileSync(join(RAW, `gist-${n}.jsonl`), raw);
            log(`  saved gist-${n}.jsonl  (gist ${g.id}/${fname}, curl)`);
            n++;
          } catch (e2) { log(`  SKIP gist ${g.id}/${fname}: ${String(e2.message).slice(0, 80)}`); }
        }
      }
    }
  } catch (e) { log(`gist fetch failed: ${String(e.message).slice(0, 200)}`); }
  log(`total files: ${n}\n`);
}

// ---------- validation helpers ----------
function findNonFinite(obj, path = "$") {
  const bad = [];
  if (typeof obj === "number" && !Number.isFinite(obj)) bad.push(`${path}=${obj}`);
  else if (Array.isArray(obj)) obj.forEach((v, i) => bad.push(...findNonFinite(v, `${path}[${i}]`)));
  else if (obj && typeof obj === "object")
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) bad.push(`${path}.${k}=undefined`);
      else bad.push(...findNonFinite(v, `${path}.${k}`));
    }
  return bad;
}

function cmpVer(a, b) {
  const pa = a.split(".").map(Number), pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) { const d = (pa[i] ?? 0) - (pb[i] ?? 0); if (d) return d; }
  return 0;
}

// Structure baseline: types/keys already known from the dogfood corpus + spec.
const KNOWN_TYPES = new Set(["user","assistant","attachment","system","summary","file-history-snapshot","queue-operation","last-prompt","pr-link","custom-title","mode","worktree-state","permission-mode","ai-title","todo","plan"]);

// ---------- run ----------
async function main() {
  if (!process.argv.includes("--skip-download")) download();

  const files = readdirSync(RAW).filter((f) => f.endsWith(".jsonl"));
  log(`## Analysis of ${files.length} files`);
  const newTypes = new Map(); // type -> first file
  const oddVersions = new Map();
  const crashes = [];
  const nonFinite = [];
  const warningKinds = new Map();

  for (const f of files) {
    // each file gets its own fake project dir so failures are attributable
    const dir = join(ROOT, "run", f.replace(/\W/g, "_"));
    const proj = join(dir, "C--harvest");
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(proj, { recursive: true });
    const target = join(proj, "0a00aaaa-0000-4000-8000-000000000001.jsonl");
    writeFileSync(target, readFileToString(join(RAW, f)));

    try {
      const m = await analyze({ dir, now: new Date("2026-06-12T00:00:00Z") });
      const bad = findNonFinite(m);
      if (bad.length) nonFinite.push(`${f}: ${bad.slice(0, 5).join(", ")}`);
      for (const w of m.source.parserWarnings) {
        const k = w.kind + (w.tool ? `:${w.tool}` : "") + (w.type ? `:${w.type}` : "") + (w.ext ? `:${w.ext}` : "");
        warningKinds.set(k, (warningKinds.get(k) ?? 0) + w.count ?? 1);
      }
      const [lo, hi] = m.source.ccVersionRange ?? [null, null];
      for (const v of [lo, hi]) {
        if (v && (cmpVer(v, VERSION_RANGE[0]) < 0 || cmpVer(v, VERSION_RANGE[1]) > 0))
          oddVersions.set(v, f);
      }
      const s = await survey(dir);
      for (const t of s.recordTypes) {
        if (!KNOWN_TYPES.has(t.type)) newTypes.set(t.type, `${f} ×${t.count}`);
      }
    } catch (e) {
      crashes.push(`${f}: ${e.stack?.split("\n").slice(0, 3).join(" | ")}`);
    }
  }

  log(`\n### Crashes (${crashes.length})`); crashes.forEach((c) => log(`- ${c}`));
  log(`\n### Non-finite/undefined in output (${nonFinite.length})`); nonFinite.forEach((c) => log(`- ${c}`));
  log(`\n### Record types outside baseline (${newTypes.size})`);
  for (const [t, src] of newTypes) log(`- ${t}  (${src})`);
  log(`\n### CC versions outside ${VERSION_RANGE.join("–")} (${oddVersions.size})`);
  for (const [v, src] of oddVersions) log(`- ${v}  (${src})`);
  log(`\n### Warning kinds across corpus`);
  for (const [k, c] of [...warningKinds.entries()].sort((a, b) => b[1] - a[1])) log(`- ${k}: ${c}`);

  writeFileSync(".sent/harvest-report.md", report.join("\n"));
  console.log("\nreport: .sent/harvest-report.md");
}

import { readFileSync } from "node:fs";
function readFileToString(p) { return readFileSync(p, "utf8"); }

await main();
