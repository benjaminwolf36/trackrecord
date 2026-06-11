import { describe, expect, it } from "vitest";
import { bucketFor, extensionOf } from "../src/buckets.js";
import { WarningCollector } from "../src/warnings.js";

function bucket(p: string, warnings = new WarningCollector(), seen = new Set<string>()) {
  return bucketFor(p, warnings, seen);
}

describe("bucketFor", () => {
  it("maps extensions to spec buckets", () => {
    expect(bucket("C:/x/a.ts")).toBe("code");
    expect(bucket("/x/a.py")).toBe("code");
    expect(bucket("/x/a.md")).toBe("docs");
    expect(bucket("/x/a.json")).toBe("config");
    expect(bucket("/x/a.scss")).toBe("styles");
  });

  it("routes lockfiles, *.min.*, and build paths to generated", () => {
    expect(bucket("/x/pnpm-lock.yaml")).toBe("generated");
    expect(bucket("/x/package-lock.json")).toBe("generated");
    expect(bucket("/x/app.min.js")).toBe("generated");
    expect(bucket("/x/dist/out.ts")).toBe("generated");
    expect(bucket("C:\\x\\node_modules\\dep\\a.ts")).toBe("generated");
  });

  it("sends unknown extensions to config and warns once per extension", () => {
    const warnings = new WarningCollector();
    const seen = new Set<string>();
    expect(bucket("/x/data.xyz", warnings, seen)).toBe("config");
    expect(bucket("/x/other.xyz", warnings, seen)).toBe("config");
    expect(warnings.get("unknownExtension")).toEqual([
      { kind: "unknownExtension", ext: "xyz", count: 1 },
    ]);
  });

  it("extracts extensions case-insensitively, dotfiles have none", () => {
    expect(extensionOf("/x/A.TSX")).toBe("tsx");
    expect(extensionOf("/x/.gitignore")).toBe("");
  });
});
