import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/card.ts"],
  format: ["esm"],
  clean: true,
  sourcemap: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
