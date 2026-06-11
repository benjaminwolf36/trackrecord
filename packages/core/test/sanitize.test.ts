import { describe, expect, it } from "vitest";
import {
  redactMcpToolName,
  safeEnumValue,
  safeExt,
  safeKeyName,
  safeToolName,
  safeTypeName,
  safeVersion,
} from "../src/sanitize.js";

describe("surfaced-label sanitizers", () => {
  it("passes format-controlled values through unchanged", () => {
    expect(safeTypeName("file-history-snapshot")).toBe("file-history-snapshot");
    expect(safeKeyName("isCompactSummary")).toBe("isCompactSummary");
    expect(safeKeyName("cache_read_input_tokens")).toBe("cache_read_input_tokens");
    expect(safeToolName("ExitPlanMode")).toBe("ExitPlanMode");
    expect(safeExt("ipynb")).toBe("ipynb");
    expect(safeExt("(none)")).toBe("(none)");
    expect(safeEnumValue("claude-desktop")).toBe("claude-desktop");
    expect(safeVersion("2.1.170")).toBe("2.1.170");
  });

  it("replaces anything path-, prompt-, or code-shaped wholesale (never truncates)", () => {
    expect(safeTypeName("C:/Users/rt/secret.md")).toBe("<invalid-type>");
    expect(safeKeyName("RT_LEAK C:/secret/path")).toBe("<invalid-key>");
    expect(safeToolName("Tool C:/Users/rt/dump.ts")).toBe("<invalid-tool>");
    expect(safeExt("rt_leak_ext_passwd")).toBe("<nonstandard>");
    expect(safeEnumValue("entry/C:/Users/rt")).toBe("<other>");
    expect(safeVersion("2.1.170 C:/x")).toBeNull();
  });

  it("redacts mcp server segments and sanitizes the tool suffix", () => {
    expect(redactMcpToolName("mcp__a1b2-uuid__do_thing")).toBe("mcp__<redacted>__do_thing");
    expect(redactMcpToolName("mcp__srv__exfil with C:/x")).toBe("mcp__<redacted>__<invalid-tool>");
    expect(redactMcpToolName("mcp__only")).toBe("mcp__<redacted>__<unknown>");
  });
});
