import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { discoverFiles, readRecords } from "../src/reader.js";
import { classifyRecord } from "../src/classify.js";
import { DeliveryEngine } from "../src/delivery.js";
import { ToolsEngine } from "../src/tools.js";
import { TokensEngine, rateFor } from "../src/tokens.js";
import { WarningCollector } from "../src/warnings.js";
import { corpus } from "../../../fixtures/manifest.js";

const FIXTURES = resolve(__dirname, "../../../fixtures/projects");

async function runAll() {
  const warnings = new WarningCollector();
  const delivery = new DeliveryEngine();
  const tools = new ToolsEngine();
  const tokens = new TokensEngine();
  for (const file of await discoverFiles(FIXTURES)) {
    for await (const raw of readRecords(file.path, warnings)) {
      const record = classifyRecord(raw, warnings);
      if (!record) continue;
      delivery.addRecord(record, file.isAgent);
      tokens.addAssistant(record);
      if (record.type === "assistant") {
        const msg = record.message as { content?: { type: string; name?: string }[] };
        for (const block of msg?.content ?? []) {
          if (block.type === "tool_use" && block.name) tools.addToolUse(block.name);
        }
      }
    }
  }
  return { delivery: delivery.result(), tools: tools.result(), tokens: tokens.result() };
}

describe("DeliveryEngine", () => {
  it("dedupes prUrls and counts branches from main files only", async () => {
    const { delivery } = await runAll();
    expect(delivery).toEqual(corpus.delivery);
  });
});

describe("ToolsEngine", () => {
  it("counts builtin tools and aggregates mcp without raw names", async () => {
    const { tools } = await runAll();
    const byName = Object.fromEntries(tools.builtin.map((t) => [t.name, t.count]));
    expect(byName).toEqual(corpus.tools.builtin);
    expect(tools.mcp).toEqual(corpus.tools.mcp);
  });

  it("redacts mcp server identity to counts", () => {
    const eng = new ToolsEngine();
    eng.addToolUse("mcp__a1b2c3d4-uuid__do_thing");
    eng.addToolUse("mcp__a1b2c3d4-uuid__other_thing");
    eng.addToolUse("mcp__second-server__do_thing");
    const r = eng.result();
    expect(r.mcp).toEqual({ totalCalls: 3, servers: 2 });
    expect(JSON.stringify(r.builtin)).not.toContain("mcp__");
  });
});

describe("TokensEngine", () => {
  it("sums usage deduped by requestId (streaming partials count once)", async () => {
    const { tokens } = await runAll();
    expect(tokens.input).toBe(corpus.tokens.input);
    expect(tokens.output).toBe(corpus.tokens.output);
    expect(tokens.cacheRead).toBe(corpus.tokens.cacheRead);
    expect(tokens.cacheCreation).toBe(corpus.tokens.cacheCreation);
    expect(tokens.pricingTableVersion).toBe("2026-06");
  });

  it("prices via longest-prefix model match, unknown models contribute zero", () => {
    expect(rateFor("claude-haiku-4-5-20251001")).toEqual({ input: 1, output: 5 });
    expect(rateFor("claude-fable-5")).toEqual({ input: 10, output: 50 });
    expect(rateFor("totally-unknown-model")).toBeNull();
  });

  it("computes apiEquivalentUsd from the fixture corpus", async () => {
    const { tokens } = await runAll();
    // fable-5 rates: (629*10 + 299*50 + 35*10*0.1 + 17*10*1.25)/1e6, rounded to cents
    const expected =
      Math.round(((629 * 10 + 299 * 50 + 35 * 1 + 17 * 12.5) / 1_000_000) * 100) / 100;
    expect(tokens.apiEquivalentUsd).toBe(expected);
  });

  it("treats missing usage fields as zero, never wrong numbers", () => {
    const eng = new TokensEngine();
    eng.addAssistant({
      type: "assistant",
      requestId: "r1",
      message: { model: "claude-fable-5", usage: { input_tokens: 5 } },
    });
    const r = eng.result();
    expect(r).toMatchObject({ input: 5, output: 0, cacheRead: 0, cacheCreation: 0 });
  });
});
