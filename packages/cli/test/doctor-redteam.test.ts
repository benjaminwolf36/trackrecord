import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { survey } from "@trackrecord/core";
import { renderDoctor } from "../src/doctor.js";

/**
 * Privacy red-team: fixtures/redteam plants an RT_LEAK_* sentinel in every
 * channel doctor's survey touches — record type values, field names,
 * edit-input keys, tool names, usage keys, entrypoint/promptSource/version
 * values, file extensions, branch names, cwd, prompt text, tool-input
 * values, MCP server names, PR urls, attachment filenames, system content,
 * snapshot bodies, and the project directory name itself.
 *
 * The bar: doctor output must be safe to paste publicly by a user who
 * didn't read it first. ANY sentinel in the output is a P0.
 */
const REDTEAM = resolve(__dirname, "../../../fixtures/redteam");

describe("doctor privacy red-team", () => {
  it("leaks no planted sentinel through any channel", async () => {
    const out = renderDoctor(await survey(REDTEAM));
    const hits = [...new Set(out.match(/RT_LEAK_[A-Z0-9_]*/g) ?? [])];
    expect(hits).toEqual([]);
  });

  it("leaks no path fragments, usernames, or the project dir name", async () => {
    const out = renderDoctor(await survey(REDTEAM));
    expect(out).not.toContain("C:/Users");
    expect(out).not.toContain("C:\\Users");
    expect(out).not.toContain("rtuser");
    expect(out).not.toContain("bob-username");
    expect(out).not.toContain("RT-LEAK-DIRNAME");
    expect(out).not.toContain("github.com");
    expect(out).not.toContain("hunter2");
  });
});
