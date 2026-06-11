import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * The headline product invariant: zero network calls — the tool never
 * touches the network, ever, in any code path. Violating this in any
 * command is a bug. This suite scans the BUILT output, not just source.
 */

const ROOT = resolve(__dirname, "..");
const DIST_DIRS = [
  resolve(ROOT, "packages/core/dist"),
  resolve(ROOT, "packages/cli/dist"),
];

const NETWORK_MARKERS: { name: string; pattern: RegExp }[] = [
  { name: "fetch call", pattern: /\bfetch\s*\(/ },
  { name: "http import", pattern: /["'](?:node:)?https?["']/ },
  { name: "net import", pattern: /["'](?:node:)?net["']/ },
  { name: "dns import", pattern: /["'](?:node:)?dns["']/ },
  { name: "tls import", pattern: /["'](?:node:)?tls["']/ },
  { name: "undici", pattern: /undici/ },
  { name: "XMLHttpRequest", pattern: /XMLHttpRequest/ },
  { name: "WebSocket", pattern: /\bWebSocket\b/ },
];

function distFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.(js|cjs|mjs)$/.test(f))
    .map((f) => join(dir, f));
}

describe("zero-network invariant (built output)", () => {
  const files = DIST_DIRS.flatMap(distFiles);

  it("found built bundles to scan (run pnpm build first)", () => {
    expect(files.length).toBeGreaterThanOrEqual(2);
  });

  for (const marker of NETWORK_MARKERS) {
    it(`built output contains no ${marker.name}`, () => {
      for (const file of files) {
        const text = readFileSync(file, "utf8");
        expect(marker.pattern.test(text), `${marker.name} in ${file}`).toBe(false);
      }
    });
  }
});

describe("privacy invariant", () => {
  it("core reader never parses file-history-snapshot bodies (source check)", () => {
    const reader = readFileSync(resolve(ROOT, "packages/core/src/reader.ts"), "utf8");
    expect(reader).toContain('"type":"file-history-snapshot"');
    expect(reader).toContain('yield { type: "file-history-snapshot" }');
  });
});
