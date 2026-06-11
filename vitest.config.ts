import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

// Fixture expectations (active days, streaks) are authored in UTC.
process.env.TZ = "UTC";

export default defineConfig({
  resolve: {
    alias: {
      "@trackrecord/core": resolve(__dirname, "packages/core/src/index.ts"),
    },
  },
  test: {
    include: ["packages/*/test/**/*.test.ts", "test/**/*.test.ts"],
  },
});
