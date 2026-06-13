// Bundle the trackrecord parser into a single self-contained file for the plugin.
//
// One source of truth (@trackrecord/core + the CLI entry), two build outputs:
//   - packages/cli/dist/*      -> the npm `trackrecord` package (tsup)
//   - plugin/bin/trackrecord.cjs -> this self-contained bundle for the Claude Code plugin
//
// A fix in packages/core/src flows to both: rebuild the npm CLI as usual, and run
// `pnpm build:plugin` (this script) to refresh the plugin bundle.
//
// The bundle inlines core, its `diff` dep, commander, picocolors, and the pricing
// JSON. satori / @resvg/resvg-js stay external: they are only reached by the `card`
// PNG subcommand, which the plugin never invokes, so their (dynamic) requires never
// execute. esbuild is pulled in transitively via tsup; we shell out to its bin.

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const args = [
  "esbuild",
  "packages/cli/src/index.ts",
  "--bundle",
  "--platform=node",
  "--format=cjs",
  "--target=node18",
  "--alias:@trackrecord/core=./packages/core/src/index.ts",
  "--external:satori",
  "--external:@resvg/resvg-js",
  "--outfile=plugin/bin/trackrecord.cjs",
  "--legal-comments=none",
];

execFileSync("npx", args, { cwd: root, stdio: "inherit", shell: true });
console.log("built plugin/bin/trackrecord.cjs");
