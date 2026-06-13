"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// packages/core/src/sanitize.ts
function safeTypeName(type) {
  return /^[a-z][a-z0-9-]{0,31}$/.test(type) ? type : "<invalid-type>";
}
function safeKeyName(key) {
  return /^[A-Za-z_$][A-Za-z0-9_$]{0,39}$/.test(key) ? key : "<invalid-key>";
}
function safeToolName(name) {
  return /^[A-Za-z][A-Za-z0-9_-]{0,47}$/.test(name) ? name : "<invalid-tool>";
}
function redactMcpToolName(name) {
  const suffix = name.split("__").slice(2).join("__");
  return `mcp__<redacted>__${suffix ? safeToolName(suffix) : "<unknown>"}`;
}
function safeExt(ext) {
  if (ext === "(none)") return ext;
  return /^[a-z0-9]{1,12}$/.test(ext) ? ext : "<nonstandard>";
}
function safeEnumValue(value) {
  return /^[A-Za-z][A-Za-z0-9-]{0,23}$/.test(value) ? value : "<other>";
}
function safeVersion(version) {
  return /^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(version) ? version : null;
}
var init_sanitize = __esm({
  "packages/core/src/sanitize.ts"() {
    "use strict";
  }
});

// packages/core/src/types.ts
var KNOWN_RECORD_TYPES;
var init_types = __esm({
  "packages/core/src/types.ts"() {
    "use strict";
    KNOWN_RECORD_TYPES = [
      "assistant",
      "attachment",
      "user",
      "queue-operation",
      "last-prompt",
      "pr-link",
      "custom-title",
      "system",
      "mode",
      "worktree-state",
      "file-history-snapshot",
      "permission-mode",
      "ai-title",
      // session-title records written by Claude Code ≤2.0.74 (public-corpus harvest
      // 2026-06-12): {"type":"summary","summary":"<title>","leafUuid":"..."} —
      // known and ignored; the title text is never read.
      "summary"
    ];
  }
});

// packages/core/src/classify.ts
function classifyRecord(record, warnings) {
  const type = record.type;
  if (typeof type !== "string" || type.length === 0) {
    warnings.tally("skippedMalformedRecord", {});
    return null;
  }
  if (!KNOWN.has(type)) {
    warnings.tally("unknownRecordType", { type: safeTypeName(type) });
    return null;
  }
  return record;
}
var KNOWN;
var init_classify = __esm({
  "packages/core/src/classify.ts"() {
    "use strict";
    init_sanitize();
    init_types();
    KNOWN = new Set(KNOWN_RECORD_TYPES);
  }
});

// packages/core/src/delivery.ts
var DeliveryEngine;
var init_delivery = __esm({
  "packages/core/src/delivery.ts"() {
    "use strict";
    DeliveryEngine = class {
      prUrls = /* @__PURE__ */ new Set();
      repos = /* @__PURE__ */ new Set();
      branches = /* @__PURE__ */ new Set();
      addRecord(record, isAgentFile) {
        if (record.type === "pr-link") {
          if (typeof record.prUrl === "string" && record.prUrl.length > 0) {
            this.prUrls.add(record.prUrl);
          }
          if (typeof record.prRepository === "string" && record.prRepository.length > 0) {
            this.repos.add(record.prRepository);
          }
          return;
        }
        if (!isAgentFile && typeof record.gitBranch === "string" && record.gitBranch.length > 0) {
          this.branches.add(record.gitBranch);
        }
      }
      result() {
        return {
          pullRequests: this.prUrls.size,
          repositories: this.repos.size,
          branches: this.branches.size,
          claudeBranches: [...this.branches].filter((b) => /^claude\//.test(b)).length
        };
      }
    };
  }
});

// ../../../node_modules/.pnpm/diff@9.0.0/node_modules/diff/libesm/diff/base.js
var Diff;
var init_base = __esm({
  "../../../node_modules/.pnpm/diff@9.0.0/node_modules/diff/libesm/diff/base.js"() {
    Diff = class {
      diff(oldStr, newStr, options = {}) {
        let callback;
        if (typeof options === "function") {
          callback = options;
          options = {};
        } else if ("callback" in options) {
          callback = options.callback;
        }
        const oldString = this.castInput(oldStr, options);
        const newString = this.castInput(newStr, options);
        const oldTokens = this.removeEmpty(this.tokenize(oldString, options));
        const newTokens = this.removeEmpty(this.tokenize(newString, options));
        return this.diffWithOptionsObj(oldTokens, newTokens, options, callback);
      }
      diffWithOptionsObj(oldTokens, newTokens, options, callback) {
        var _a;
        const done = (value) => {
          value = this.postProcess(value, options);
          if (callback) {
            setTimeout(function() {
              callback(value);
            }, 0);
            return void 0;
          } else {
            return value;
          }
        };
        const newLen = newTokens.length, oldLen = oldTokens.length;
        let editLength = 1;
        let maxEditLength = newLen + oldLen;
        if (options.maxEditLength != null) {
          maxEditLength = Math.min(maxEditLength, options.maxEditLength);
        }
        const maxExecutionTime = (_a = options.timeout) !== null && _a !== void 0 ? _a : Infinity;
        const abortAfterTimestamp = Date.now() + maxExecutionTime;
        const bestPath = [{ oldPos: -1, lastComponent: void 0 }];
        let newPos = this.extractCommon(bestPath[0], newTokens, oldTokens, 0, options);
        if (bestPath[0].oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
          return done(this.buildValues(bestPath[0].lastComponent, newTokens, oldTokens));
        }
        let minDiagonalToConsider = -Infinity, maxDiagonalToConsider = Infinity;
        const execEditLength = () => {
          for (let diagonalPath = Math.max(minDiagonalToConsider, -editLength); diagonalPath <= Math.min(maxDiagonalToConsider, editLength); diagonalPath += 2) {
            let basePath;
            const removePath = bestPath[diagonalPath - 1], addPath = bestPath[diagonalPath + 1];
            if (removePath) {
              bestPath[diagonalPath - 1] = void 0;
            }
            let canAdd = false;
            if (addPath) {
              const addPathNewPos = addPath.oldPos - diagonalPath;
              canAdd = addPath && 0 <= addPathNewPos && addPathNewPos < newLen;
            }
            const canRemove = removePath && removePath.oldPos + 1 < oldLen;
            if (!canAdd && !canRemove) {
              bestPath[diagonalPath] = void 0;
              continue;
            }
            if (!canRemove || canAdd && removePath.oldPos < addPath.oldPos) {
              basePath = this.addToPath(addPath, true, false, 0, options);
            } else {
              basePath = this.addToPath(removePath, false, true, 1, options);
            }
            newPos = this.extractCommon(basePath, newTokens, oldTokens, diagonalPath, options);
            if (basePath.oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
              return done(this.buildValues(basePath.lastComponent, newTokens, oldTokens)) || true;
            } else {
              bestPath[diagonalPath] = basePath;
              if (basePath.oldPos + 1 >= oldLen) {
                maxDiagonalToConsider = Math.min(maxDiagonalToConsider, diagonalPath - 1);
              }
              if (newPos + 1 >= newLen) {
                minDiagonalToConsider = Math.max(minDiagonalToConsider, diagonalPath + 1);
              }
            }
          }
          editLength++;
        };
        if (callback) {
          (function exec() {
            setTimeout(function() {
              if (editLength > maxEditLength || Date.now() > abortAfterTimestamp) {
                return callback(void 0);
              }
              if (!execEditLength()) {
                exec();
              }
            }, 0);
          })();
        } else {
          while (editLength <= maxEditLength && Date.now() <= abortAfterTimestamp) {
            const ret = execEditLength();
            if (ret) {
              return ret;
            }
          }
        }
      }
      addToPath(path2, added, removed, oldPosInc, options) {
        const last = path2.lastComponent;
        if (last && !options.oneChangePerToken && last.added === added && last.removed === removed) {
          return {
            oldPos: path2.oldPos + oldPosInc,
            lastComponent: { count: last.count + 1, added, removed, previousComponent: last.previousComponent }
          };
        } else {
          return {
            oldPos: path2.oldPos + oldPosInc,
            lastComponent: { count: 1, added, removed, previousComponent: last }
          };
        }
      }
      extractCommon(basePath, newTokens, oldTokens, diagonalPath, options) {
        const newLen = newTokens.length, oldLen = oldTokens.length;
        let oldPos = basePath.oldPos, newPos = oldPos - diagonalPath, commonCount = 0;
        while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(oldTokens[oldPos + 1], newTokens[newPos + 1], options)) {
          newPos++;
          oldPos++;
          commonCount++;
          if (options.oneChangePerToken) {
            basePath.lastComponent = { count: 1, previousComponent: basePath.lastComponent, added: false, removed: false };
          }
        }
        if (commonCount && !options.oneChangePerToken) {
          basePath.lastComponent = { count: commonCount, previousComponent: basePath.lastComponent, added: false, removed: false };
        }
        basePath.oldPos = oldPos;
        return newPos;
      }
      equals(left, right, options) {
        if (options.comparator) {
          return options.comparator(left, right);
        } else {
          return left === right || !!options.ignoreCase && left.toLowerCase() === right.toLowerCase();
        }
      }
      removeEmpty(array) {
        const ret = [];
        for (let i = 0; i < array.length; i++) {
          if (array[i]) {
            ret.push(array[i]);
          }
        }
        return ret;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      castInput(value, options) {
        return value;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      tokenize(value, options) {
        return Array.from(value);
      }
      join(chars) {
        return chars.join("");
      }
      postProcess(changeObjects, options) {
        return changeObjects;
      }
      get useLongestToken() {
        return false;
      }
      buildValues(lastComponent, newTokens, oldTokens) {
        const components = [];
        let nextComponent;
        while (lastComponent) {
          components.push(lastComponent);
          nextComponent = lastComponent.previousComponent;
          delete lastComponent.previousComponent;
          lastComponent = nextComponent;
        }
        components.reverse();
        const componentLen = components.length;
        let componentPos = 0, newPos = 0, oldPos = 0;
        for (; componentPos < componentLen; componentPos++) {
          const component = components[componentPos];
          if (!component.removed) {
            if (!component.added && this.useLongestToken) {
              let value = newTokens.slice(newPos, newPos + component.count);
              value = value.map(function(value2, i) {
                const oldValue = oldTokens[oldPos + i];
                return oldValue.length > value2.length ? oldValue : value2;
              });
              component.value = this.join(value);
            } else {
              component.value = this.join(newTokens.slice(newPos, newPos + component.count));
            }
            newPos += component.count;
            if (!component.added) {
              oldPos += component.count;
            }
          } else {
            component.value = this.join(oldTokens.slice(oldPos, oldPos + component.count));
            oldPos += component.count;
          }
        }
        return components;
      }
    };
  }
});

// ../../../node_modules/.pnpm/diff@9.0.0/node_modules/diff/libesm/diff/line.js
function diffLines(oldStr, newStr, options) {
  return lineDiff.diff(oldStr, newStr, options);
}
function tokenize(value, options) {
  if (options.stripTrailingCr) {
    value = value.replace(/\r\n/g, "\n");
  }
  const retLines = [], linesAndNewlines = value.split(/(\n|\r\n)/);
  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
    linesAndNewlines.pop();
  }
  for (let i = 0; i < linesAndNewlines.length; i++) {
    const line = linesAndNewlines[i];
    if (i % 2 && !options.newlineIsToken) {
      retLines[retLines.length - 1] += line;
    } else {
      retLines.push(line);
    }
  }
  return retLines;
}
var LineDiff, lineDiff;
var init_line = __esm({
  "../../../node_modules/.pnpm/diff@9.0.0/node_modules/diff/libesm/diff/line.js"() {
    init_base();
    LineDiff = class extends Diff {
      constructor() {
        super(...arguments);
        this.tokenize = tokenize;
      }
      equals(left, right, options) {
        if (options.ignoreWhitespace) {
          if (!options.newlineIsToken || !left.includes("\n")) {
            left = left.trim();
          }
          if (!options.newlineIsToken || !right.includes("\n")) {
            right = right.trim();
          }
        } else if (options.ignoreNewlineAtEof && !options.newlineIsToken) {
          if (left.endsWith("\n")) {
            left = left.slice(0, -1);
          }
          if (right.endsWith("\n")) {
            right = right.slice(0, -1);
          }
        }
        return super.equals(left, right, options);
      }
    };
    lineDiff = new LineDiff();
  }
});

// ../../../node_modules/.pnpm/diff@9.0.0/node_modules/diff/libesm/index.js
var init_libesm = __esm({
  "../../../node_modules/.pnpm/diff@9.0.0/node_modules/diff/libesm/index.js"() {
    init_line();
  }
});

// packages/core/src/buckets.ts
function normalizePath(p) {
  return p.replace(/\\/g, "/");
}
function extensionOf(filePath) {
  const base = normalizePath(filePath).split("/").pop() ?? "";
  const i = base.lastIndexOf(".");
  return i > 0 ? base.slice(i + 1).toLowerCase() : "";
}
function isCodeExt(ext) {
  return CODE.has(ext);
}
function bucketFor(filePath, warnings, seenUnknown) {
  const p = normalizePath(filePath);
  const base = (p.split("/").pop() ?? "").toLowerCase();
  if (LOCKFILES.has(base)) return "generated";
  if (base.includes(".min.")) return "generated";
  if (GENERATED_SEGMENTS.some((seg) => p.includes(seg))) return "generated";
  const ext = extensionOf(p);
  if (CODE.has(ext)) return "code";
  if (DOCS.has(ext)) return "docs";
  if (CONFIG.has(ext)) return "config";
  if (STYLES.has(ext)) return "styles";
  const key = safeExt(ext === "" ? "(none)" : ext);
  if (!seenUnknown.has(key)) {
    seenUnknown.add(key);
    warnings.tally("unknownExtension", { ext: key });
  }
  return "config";
}
var CODE, DOCS, CONFIG, STYLES, LOCKFILES, GENERATED_SEGMENTS;
var init_buckets = __esm({
  "packages/core/src/buckets.ts"() {
    "use strict";
    init_sanitize();
    CODE = /* @__PURE__ */ new Set([
      "ts",
      "tsx",
      "js",
      "jsx",
      "mjs",
      "cjs",
      "py",
      "rb",
      "go",
      "rs",
      "java",
      "kt",
      "swift",
      "c",
      "cc",
      "cpp",
      "h",
      "hpp",
      "cs",
      "php",
      "sql",
      "sh",
      "bash",
      "zsh",
      "ps1",
      "vue",
      "svelte",
      "astro"
    ]);
    DOCS = /* @__PURE__ */ new Set(["md", "mdx", "txt", "rst", "adoc", "html", "htm"]);
    CONFIG = /* @__PURE__ */ new Set(["json", "jsonc", "yaml", "yml", "toml", "ini", "env", "xml", "csv"]);
    STYLES = /* @__PURE__ */ new Set(["css", "scss", "sass", "less"]);
    LOCKFILES = /* @__PURE__ */ new Set([
      "package-lock.json",
      "pnpm-lock.yaml",
      "yarn.lock",
      "cargo.lock",
      "poetry.lock",
      "gemfile.lock",
      "composer.lock",
      "bun.lockb",
      "bun.lock",
      "uv.lock",
      "go.sum",
      "gradle.lockfile",
      "flake.lock"
    ]);
    GENERATED_SEGMENTS = ["/dist/", "/build/", "/.next/", "/node_modules/"];
  }
});

// packages/core/src/loc.ts
function emptyBuckets() {
  return { code: 0, docs: 0, config: 0, styles: 0, generated: 0, total: 0 };
}
function countLines(s) {
  if (s.length === 0) return 0;
  const lines = s.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  return lines.length;
}
function nl(s) {
  return s.length === 0 || s.endsWith("\n") ? s : `${s}
`;
}
function netDelta(oldLines, newLines) {
  return { added: Math.max(0, newLines - oldLines), removed: Math.max(0, oldLines - newLines) };
}
function diffCounts(oldStr, newStr) {
  const oldLines = countLines(oldStr);
  const newLines = countLines(newStr);
  if (oldLines + newLines > MAX_DIFF_LINES) return netDelta(oldLines, newLines);
  const parts = diffLines(nl(oldStr), nl(newStr), { maxEditLength: MAX_EDIT_LENGTH });
  if (parts === void 0) return netDelta(oldLines, newLines);
  let added = 0;
  let removed = 0;
  for (const part of parts) {
    if (part.added) added += part.count ?? 0;
    else if (part.removed) removed += part.count ?? 0;
  }
  return { added, removed };
}
function str(v) {
  return typeof v === "string" ? v : void 0;
}
var COUNTED_WRITERS, SUSPECT_WRITER_ALLOWLIST, MAX_DIFF_LINES, MAX_EDIT_LENGTH, LocEngine;
var init_loc = __esm({
  "packages/core/src/loc.ts"() {
    "use strict";
    init_libesm();
    init_buckets();
    init_sanitize();
    COUNTED_WRITERS = /* @__PURE__ */ new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);
    SUSPECT_WRITER_ALLOWLIST = /* @__PURE__ */ new Set([
      // ExitPlanMode input is { plan (long multiline text), planFilePath, allowedPrompts };
      // planFilePath matches /file/ and plan is a >500-char multiline string, so it trips
      // the heuristic — but it only presents a plan for approval, never touching the disk.
      "ExitPlanMode"
    ]);
    MAX_DIFF_LINES = 2e4;
    MAX_EDIT_LENGTH = 2e3;
    LocEngine = class {
      constructor(warnings) {
        this.warnings = warnings;
      }
      warnings;
      lastContent = /* @__PURE__ */ new Map();
      touched = /* @__PURE__ */ new Set();
      created = /* @__PURE__ */ new Set();
      added = emptyBuckets();
      removed = emptyBuckets();
      gross = 0;
      byLang = /* @__PURE__ */ new Map();
      byProject = /* @__PURE__ */ new Map();
      seenUnknownExt = /* @__PURE__ */ new Set();
      counters = { writes: 0, edits: 0, multiEdits: 0, notebookEdits: 0 };
      applyToolUse(name, input, ctx) {
        if (typeof input !== "object" || input === null) {
          if (COUNTED_WRITERS.has(name)) this.warnings.tally("skippedMalformedRecord", { tool: name });
          return;
        }
        const inp = input;
        switch (name) {
          case "Write": {
            const filePath = str(inp.file_path);
            const content = str(inp.content);
            if (filePath === void 0 || content === void 0) {
              this.warnings.tally("skippedMalformedRecord", { tool: name });
              return;
            }
            this.counters.writes += 1;
            const p = normalizePath(filePath);
            const prior = this.lastContent.get(p);
            this.gross += countLines(content);
            if (prior === void 0) {
              this.created.add(p);
              this.record(p, ctx, countLines(content), 0);
            } else {
              const { added, removed } = diffCounts(prior, content);
              this.record(p, ctx, added, removed);
            }
            this.lastContent.set(p, content);
            return;
          }
          case "Edit": {
            const filePath = str(inp.file_path);
            const oldString = str(inp.old_string);
            const newString = str(inp.new_string);
            if (filePath === void 0 || oldString === void 0 || newString === void 0) {
              this.warnings.tally("skippedMalformedRecord", { tool: name });
              return;
            }
            this.counters.edits += 1;
            this.applyEdit(normalizePath(filePath), oldString, newString, ctx);
            return;
          }
          case "MultiEdit": {
            const filePath = str(inp.file_path);
            const edits = Array.isArray(inp.edits) ? inp.edits : void 0;
            if (filePath === void 0 || edits === void 0) {
              this.warnings.tally("skippedMalformedRecord", { tool: name });
              return;
            }
            this.counters.multiEdits += 1;
            for (const e of edits) {
              if (typeof e !== "object" || e === null) continue;
              const ed = e;
              const oldString = str(ed.old_string);
              const newString = str(ed.new_string);
              if (oldString === void 0 || newString === void 0) continue;
              this.applyEdit(normalizePath(filePath), oldString, newString, ctx);
            }
            return;
          }
          case "NotebookEdit": {
            const filePath = str(inp.notebook_path) ?? str(inp.file_path);
            const newSource = str(inp.new_source);
            const mode = str(inp.edit_mode) ?? "replace";
            if (filePath === void 0) {
              this.warnings.tally("skippedMalformedRecord", { tool: name });
              return;
            }
            this.counters.notebookEdits += 1;
            if (mode !== "delete" && newSource !== void 0) {
              const lines = countLines(newSource);
              this.gross += lines;
              this.record(normalizePath(filePath), ctx, lines, 0);
            }
            return;
          }
          default:
            this.inspectSuspect(name, inp);
        }
      }
      applyEdit(p, oldString, newString, ctx) {
        const { added, removed } = diffCounts(oldString, newString);
        this.gross += countLines(newString);
        this.record(p, ctx, added, removed);
      }
      record(p, ctx, added, removed) {
        this.touched.add(p);
        const bucket = bucketFor(p, this.warnings, this.seenUnknownExt);
        this.added[bucket] += added;
        this.added.total += added;
        this.removed[bucket] += removed;
        this.removed.total += removed;
        if (bucket !== "generated") {
          const lang = extensionOf(p) || "(none)";
          const entry = this.byLang.get(lang) ?? { linesAdded: 0, files: /* @__PURE__ */ new Set() };
          entry.linesAdded += added;
          entry.files.add(p);
          this.byLang.set(lang, entry);
        }
        this.byProject.set(ctx.project, (this.byProject.get(ctx.project) ?? 0) + added);
      }
      /** Spec suspect-writer heuristic: detect and warn ONLY, never count. */
      inspectSuspect(name, inp) {
        if (SUSPECT_WRITER_ALLOWLIST.has(name)) return;
        if (name.startsWith("mcp__")) return;
        const values = Object.entries(inp);
        const hasPathKey = values.some(([k, v]) => /path|file/i.test(k) && typeof v === "string");
        const hasBigString = Object.values(inp).some(
          (v) => typeof v === "string" && v.length > 500 && v.includes("\n")
        );
        if (hasPathKey && hasBigString) {
          this.warnings.tally("suspectedWriteTool", { tool: safeToolName(name) });
        }
      }
      result(sessionsByProject) {
        return {
          linesAdded: { ...this.added },
          linesRemoved: { ...this.removed },
          grossLinesWritten: this.gross,
          filesTouched: this.touched.size,
          filesCreated: this.created.size,
          byLanguage: [...this.byLang.entries()].map(([lang, e]) => ({ lang, linesAdded: e.linesAdded, files: e.files.size })).sort((a, b) => b.linesAdded - a.linesAdded),
          byProject: [.../* @__PURE__ */ new Set([...this.byProject.keys(), ...sessionsByProject.keys()])].map((project) => ({
            project,
            linesAdded: this.byProject.get(project) ?? 0,
            sessions: sessionsByProject.get(project) ?? 0
          })).sort((a, b) => b.linesAdded - a.linesAdded),
          ...this.counters
        };
      }
    };
  }
});

// packages/core/src/reader.ts
async function discoverFiles(dir) {
  const out = [];
  async function walk(d) {
    let entries;
    try {
      entries = await (0, import_promises.readdir)(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const p = (0, import_node_path2.join)(d, entry.name);
      if (entry.isDirectory()) await walk(p);
      else if (entry.name.endsWith(".jsonl")) {
        out.push({ path: p, basename: (0, import_node_path2.basename)(p), isAgent: entry.name.startsWith("agent-") });
      }
    }
  }
  await walk(dir);
  return out.sort((a, b) => a.path < b.path ? -1 : 1);
}
async function* readRecords(filePath, warnings) {
  const rl = (0, import_node_readline.createInterface)({
    input: (0, import_node_fs2.createReadStream)(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity
  });
  const file = (0, import_node_path2.basename)(filePath);
  for await (const line of rl) {
    if (line.trim().length === 0) continue;
    if (line.includes(SNAPSHOT_MARKER)) {
      yield { type: "file-history-snapshot" };
      continue;
    }
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      warnings.tally("unparseableLine", { file });
      continue;
    }
    if (typeof record !== "object" || record === null || Array.isArray(record)) {
      warnings.tally("unparseableLine", { file });
      continue;
    }
    yield record;
  }
}
var import_node_fs2, import_promises, import_node_path2, import_node_readline, SNAPSHOT_MARKER;
var init_reader = __esm({
  "packages/core/src/reader.ts"() {
    "use strict";
    import_node_fs2 = require("node:fs");
    import_promises = require("node:fs/promises");
    import_node_path2 = require("node:path");
    import_node_readline = require("node:readline");
    SNAPSHOT_MARKER = '"type":"file-history-snapshot"';
  }
});

// packages/core/src/schema.ts
var SCHEMA_VERSION;
var init_schema = __esm({
  "packages/core/src/schema.ts"() {
    "use strict";
    SCHEMA_VERSION = "1.0.0";
  }
});

// packages/core/src/sessions.ts
function get(record, key) {
  return record[key];
}
function modal(counts) {
  let best;
  let bestCount = 0;
  for (const [k, c] of counts) {
    if (c > bestCount) {
      best = k;
      bestCount = c;
    }
  }
  return best;
}
function isHumanPrompt(record) {
  if (record.type !== "user") return false;
  if (record.toolUseResult !== void 0) return false;
  if (record.isMeta === true) return false;
  if (record.isCompactSummary === true) return false;
  if (record.isSidechain === true) return false;
  const message = get(record, "message");
  if (typeof message !== "object" || message === null) return false;
  const content = message.content;
  if (typeof content === "string") return content.length > 0;
  if (Array.isArray(content)) {
    return content.some(
      (b) => typeof b === "object" && b !== null && b.type === "text"
    );
  }
  return false;
}
function dayKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function dayNumber(key) {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / 864e5;
}
function streaks(sortedDays, now) {
  if (sortedDays.length === 0) return { longest: 0, current: 0 };
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    run = dayNumber(sortedDays[i]) - dayNumber(sortedDays[i - 1]) === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }
  const today = dayNumber(dayKey(now));
  const last = dayNumber(sortedDays[sortedDays.length - 1]);
  if (today - last > 1) return { longest, current: 0 };
  let current = 1;
  for (let i = sortedDays.length - 1; i > 0; i--) {
    if (dayNumber(sortedDays[i]) - dayNumber(sortedDays[i - 1]) === 1) current += 1;
    else break;
  }
  return { longest, current };
}
var import_node_path3, SessionEngine;
var init_sessions = __esm({
  "packages/core/src/sessions.ts"() {
    "use strict";
    import_node_path3 = require("node:path");
    init_sanitize();
    SessionEngine = class {
      current = null;
      humanPrompts = 0;
      globalRequestIds = /* @__PURE__ */ new Set();
      compactions = 0;
      subagentRuns = 0;
      activeDayKeys = /* @__PURE__ */ new Set();
      sessionsByProject = /* @__PURE__ */ new Map();
      byEntrypoint = /* @__PURE__ */ new Map();
      firstSession = null;
      sessionCount = 0;
      startFile(file) {
        this.finishFile();
        if (file.isAgent) this.subagentRuns += 1;
        this.current = {
          file,
          humanPrompts: 0,
          requestIds: /* @__PURE__ */ new Set(),
          cwdCounts: /* @__PURE__ */ new Map(),
          entrypointCounts: /* @__PURE__ */ new Map(),
          firstTimestamp: null
        };
      }
      addRecord(record) {
        const state = this.current;
        if (!state) return;
        const cwd = get(record, "cwd");
        if (typeof cwd === "string" && cwd.length > 0) {
          state.cwdCounts.set(cwd, (state.cwdCounts.get(cwd) ?? 0) + 1);
        }
        const entrypoint = get(record, "entrypoint");
        if (typeof entrypoint === "string" && entrypoint.length > 0) {
          state.entrypointCounts.set(entrypoint, (state.entrypointCounts.get(entrypoint) ?? 0) + 1);
        }
        const timestamp = get(record, "timestamp");
        if (typeof timestamp === "string" && state.firstTimestamp === null) {
          state.firstTimestamp = timestamp;
        }
        if (record.type === "system" && record.subtype === "compact_boundary") {
          this.compactions += 1;
          return;
        }
        if (record.type === "assistant") {
          const requestId = get(record, "requestId");
          const key = typeof requestId === "string" && requestId.length > 0 ? requestId : `uuid:${String(get(record, "uuid") ?? Math.random())}`;
          state.requestIds.add(key);
          this.globalRequestIds.add(key);
          return;
        }
        if (isHumanPrompt(record)) {
          state.humanPrompts += 1;
          this.humanPrompts += 1;
          if (typeof timestamp === "string") {
            const d = new Date(timestamp);
            if (!Number.isNaN(d.getTime())) this.activeDayKeys.add(dayKey(d));
          }
        }
      }
      finishFile() {
        const state = this.current;
        this.current = null;
        if (!state || state.file.isAgent) return;
        if (state.humanPrompts < 1 || state.requestIds.size < 1) return;
        this.sessionCount += 1;
        const project = (0, import_node_path3.basename)(modal(state.cwdCounts) ?? "unknown");
        this.sessionsByProject.set(project, (this.sessionsByProject.get(project) ?? 0) + 1);
        const entrypoint = safeEnumValue(modal(state.entrypointCounts) ?? "unknown");
        this.byEntrypoint.set(entrypoint, (this.byEntrypoint.get(entrypoint) ?? 0) + 1);
        if (state.firstTimestamp !== null) {
          if (this.firstSession === null || state.firstTimestamp < this.firstSession) {
            this.firstSession = state.firstTimestamp;
          }
        }
      }
      projectSessions() {
        return this.sessionsByProject;
      }
      result(now) {
        this.finishFile();
        const days = [...this.activeDayKeys].sort();
        const { longest, current } = streaks(days, now);
        return {
          sessions: this.sessionCount,
          subagentRuns: this.subagentRuns,
          projects: this.sessionsByProject.size,
          activeDays: days.length,
          longestStreak: longest,
          currentStreak: current,
          humanPrompts: this.humanPrompts,
          assistantTurns: this.globalRequestIds.size,
          firstSession: this.firstSession,
          byEntrypoint: Object.fromEntries(this.byEntrypoint),
          compactions: this.compactions
        };
      }
    };
  }
});

// packages/core/pricing/2026-06.json
var __default;
var init__ = __esm({
  "packages/core/pricing/2026-06.json"() {
    __default = {
      version: "2026-06",
      _note: "API-equivalent rates in USD per million tokens. Current-model rates sourced from Anthropic docs (cached 2026-05-26 via claude-api reference); pre-4.5 legacy rates are best-effort historical values. cacheRead/cacheWrite are multipliers on the input rate. Unknown models contribute $0 and are simply unpriced - never guessed.",
      cacheReadMultiplier: 0.1,
      cacheWriteMultiplier: 1.25,
      models: {
        "claude-fable-5": { input: 10, output: 50 },
        "claude-opus-4-8": { input: 5, output: 25 },
        "claude-opus-4-7": { input: 5, output: 25 },
        "claude-opus-4-6": { input: 5, output: 25 },
        "claude-opus-4-5": { input: 5, output: 25 },
        "claude-opus-4-1": { input: 15, output: 75 },
        "claude-opus-4-0": { input: 15, output: 75 },
        "claude-opus-4-20250514": { input: 15, output: 75 },
        "claude-sonnet-4-6": { input: 3, output: 15 },
        "claude-sonnet-4-5": { input: 3, output: 15 },
        "claude-sonnet-4-0": { input: 3, output: 15 },
        "claude-sonnet-4-20250514": { input: 3, output: 15 },
        "claude-3-7-sonnet": { input: 3, output: 15 },
        "claude-haiku-4-5": { input: 1, output: 5 },
        "claude-3-5-haiku": { input: 0.8, output: 4 },
        "claude-3-haiku": { input: 0.25, output: 1.25 }
      }
    };
  }
});

// packages/core/src/tokens.ts
function rateFor(model) {
  let best = null;
  let bestLen = 0;
  for (const [prefix, rate] of Object.entries(RATES)) {
    if (model.startsWith(prefix) && prefix.length > bestLen) {
      best = rate;
      bestLen = prefix.length;
    }
  }
  return best;
}
function num(v) {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0;
}
var RATES, TokensEngine;
var init_tokens = __esm({
  "packages/core/src/tokens.ts"() {
    "use strict";
    init__();
    RATES = __default.models;
    TokensEngine = class {
      seen = /* @__PURE__ */ new Set();
      totals = { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };
      usd = 0;
      addAssistant(record) {
        if (record.type !== "assistant") return;
        const requestId = record.requestId;
        const key = typeof requestId === "string" && requestId.length > 0 ? requestId : `uuid:${String(record.uuid ?? "")}`;
        if (this.seen.has(key)) return;
        this.seen.add(key);
        const message = record.message;
        if (typeof message !== "object" || message === null) return;
        const msg = message;
        const usage = msg.usage;
        if (typeof usage !== "object" || usage === null) return;
        const u = usage;
        const input = num(u.input_tokens);
        const output = num(u.output_tokens);
        const cacheRead = num(u.cache_read_input_tokens);
        const cacheCreation = num(u.cache_creation_input_tokens);
        this.totals.input += input;
        this.totals.output += output;
        this.totals.cacheRead += cacheRead;
        this.totals.cacheCreation += cacheCreation;
        const model = typeof msg.model === "string" ? msg.model : "";
        const rate = rateFor(model);
        if (rate) {
          this.usd += (input * rate.input + output * rate.output + cacheRead * rate.input * __default.cacheReadMultiplier + cacheCreation * rate.input * __default.cacheWriteMultiplier) / 1e6;
        }
      }
      result() {
        return {
          ...this.totals,
          apiEquivalentUsd: Math.round(this.usd * 100) / 100,
          pricingTableVersion: __default.version
        };
      }
    };
  }
});

// packages/core/src/tools.ts
var ToolsEngine;
var init_tools = __esm({
  "packages/core/src/tools.ts"() {
    "use strict";
    init_sanitize();
    ToolsEngine = class {
      builtin = /* @__PURE__ */ new Map();
      mcpCalls = 0;
      mcpServers = /* @__PURE__ */ new Set();
      addToolUse(name) {
        if (name.startsWith("mcp__")) {
          this.mcpCalls += 1;
          const server = name.split("__")[1];
          if (server) this.mcpServers.add(server);
          return;
        }
        const safe = safeToolName(name);
        this.builtin.set(safe, (this.builtin.get(safe) ?? 0) + 1);
      }
      result() {
        return {
          builtin: [...this.builtin.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || (a.name < b.name ? -1 : 1)),
          mcp: { totalCalls: this.mcpCalls, servers: this.mcpServers.size }
        };
      }
    };
  }
});

// packages/core/src/warnings.ts
var WarningCollector;
var init_warnings = __esm({
  "packages/core/src/warnings.ts"() {
    "use strict";
    WarningCollector = class {
      counts = /* @__PURE__ */ new Map();
      tally(kind, detail = {}) {
        const key = `${kind}|${detail.type ?? ""}|${detail.tool ?? ""}|${detail.file ?? ""}|${detail.ext ?? ""}`;
        const existing = this.counts.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          this.counts.set(key, { kind, ...detail, count: 1 });
        }
      }
      get(kind) {
        return this.toJSON().filter((w) => w.kind === kind);
      }
      toJSON() {
        return [...this.counts.values()];
      }
    };
  }
});

// packages/core/src/assemble.ts
function compareVersions(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}
function toolUses(record) {
  if (record.type !== "assistant") return [];
  const message = record.message;
  if (typeof message !== "object" || message === null) return [];
  const content = message.content;
  if (!Array.isArray(content)) return [];
  const out = [];
  for (const block of content) {
    if (typeof block !== "object" || block === null) continue;
    const b = block;
    if (b.type === "tool_use" && typeof b.name === "string") {
      out.push({ name: b.name, input: b.input });
    }
  }
  return out;
}
function redactProjects(output, showProjectNames) {
  if (showProjectNames) return output;
  return {
    ...output,
    byProject: output.byProject.map((p, i) => ({ ...p, project: `project-${i + 1}` }))
  };
}
async function analyze(options) {
  const now = options.now ?? /* @__PURE__ */ new Date();
  const warnings = new WarningCollector();
  const sessions = new SessionEngine();
  const delivery = new DeliveryEngine();
  const tools = new ToolsEngine();
  const tokens = new TokensEngine();
  const loc = new LocEngine(warnings);
  const files = await discoverFiles(options.dir);
  let records = 0;
  let minVersion = null;
  let maxVersion = null;
  let minTs = null;
  let maxTs = null;
  const locEvents = [];
  const seenUuids = /* @__PURE__ */ new Set();
  for (const file of files) {
    sessions.startFile(file);
    for await (const raw of readRecords(file.path, warnings)) {
      records += 1;
      const record = classifyRecord(raw, warnings);
      if (!record) continue;
      if (typeof record.uuid === "string" && record.uuid.length > 0) {
        if (seenUuids.has(record.uuid)) continue;
        seenUuids.add(record.uuid);
      }
      if (options.since !== void 0 || options.until !== void 0) {
        const ts = typeof record.timestamp === "string" ? Date.parse(record.timestamp) : NaN;
        if (!Number.isNaN(ts)) {
          if (options.since !== void 0 && ts < options.since.getTime()) continue;
          if (options.until !== void 0 && ts > options.until.getTime()) continue;
        }
      }
      const version = typeof record.version === "string" ? safeVersion(record.version) : null;
      if (version !== null) {
        if (minVersion === null || compareVersions(version, minVersion) < 0) minVersion = version;
        if (maxVersion === null || compareVersions(version, maxVersion) > 0) maxVersion = version;
      }
      const timestamp = record.timestamp;
      if (typeof timestamp === "string" && timestamp.length > 0) {
        if (minTs === null || timestamp < minTs) minTs = timestamp;
        if (maxTs === null || timestamp > maxTs) maxTs = timestamp;
      }
      sessions.addRecord(record);
      delivery.addRecord(record, file.isAgent);
      tokens.addAssistant(record);
      const project = (0, import_node_path4.basename)(typeof record.cwd === "string" && record.cwd ? record.cwd : "unknown");
      for (const { name, input } of toolUses(record)) {
        tools.addToolUse(name);
        if (COUNTED_WRITERS.has(name)) {
          locEvents.push({ name, input, timestamp: typeof timestamp === "string" ? timestamp : "", project });
        } else {
          loc.applyToolUse(name, input, { project });
        }
      }
    }
    sessions.finishFile();
  }
  locEvents.sort((a, b) => a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0);
  for (const e of locEvents) loc.applyToolUse(e.name, e.input, { project: e.project });
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: now.toISOString(),
    source: {
      files: files.length,
      records,
      ccVersionRange: minVersion !== null && maxVersion !== null ? [minVersion, maxVersion] : [null, null],
      dateRange: minTs !== null && maxTs !== null ? [minTs, maxTs] : [null, null],
      parserWarnings: warnings.toJSON()
    },
    output: redactProjects(loc.result(sessions.projectSessions()), options.showProjectNames === true),
    delivery: delivery.result(),
    activity: sessions.result(now),
    tools: tools.result(),
    tokens: tokens.result(),
    git: { reserved: true }
  };
}
var import_node_path4;
var init_assemble = __esm({
  "packages/core/src/assemble.ts"() {
    "use strict";
    import_node_path4 = require("node:path");
    init_classify();
    init_delivery();
    init_loc();
    init_reader();
    init_sanitize();
    init_schema();
    init_sessions();
    init_tokens();
    init_tools();
    init_warnings();
  }
});

// packages/core/src/survey.ts
function redactToolName(name) {
  return name.startsWith("mcp__") ? redactMcpToolName(name) : safeToolName(name);
}
function toolUseBlocks(record) {
  if (record.type !== "assistant") return [];
  const message = record.message;
  if (typeof message !== "object" || message === null) return [];
  const content = message.content;
  if (!Array.isArray(content)) return [];
  return content.filter(
    (b) => typeof b === "object" && b !== null && b.type === "tool_use"
  ).map((b) => ({ name: typeof b.name === "string" ? b.name : "<unnamed>", input: b.input }));
}
async function survey(dir) {
  const warnings = new WarningCollector();
  const typeInfo = /* @__PURE__ */ new Map();
  const editShapes = /* @__PURE__ */ new Map();
  const toolCounts = /* @__PURE__ */ new Map();
  const usageKeys = /* @__PURE__ */ new Set();
  const entrypointValues = /* @__PURE__ */ new Map();
  const promptSourceValues = /* @__PURE__ */ new Map();
  const sessionIdFiles = /* @__PURE__ */ new Map();
  let recordsWithEntrypoint = 0;
  let recordsWithoutEntrypoint = 0;
  let sidechainRecords = 0;
  let compactBoundaries = 0;
  let stubs = 0;
  let minVersion = null;
  let maxVersion = null;
  const files = await discoverFiles(dir);
  for (const file of files) {
    let humanPrompts = 0;
    let assistantTurns = 0;
    for await (const raw of readRecords(file.path, warnings)) {
      const typeName = safeTypeName(String(raw.type ?? "<invalid-type>"));
      const info = typeInfo.get(typeName) ?? { count: 0, keys: /* @__PURE__ */ new Set() };
      info.count += 1;
      for (const k of Object.keys(raw)) info.keys.add(safeKeyName(k));
      typeInfo.set(typeName, info);
      const record = classifyRecord(raw, warnings);
      if (!record) continue;
      if (record.isSidechain === true) sidechainRecords += 1;
      if (record.type === "system" && record.subtype === "compact_boundary") compactBoundaries += 1;
      if (record.type === "assistant") assistantTurns += 1;
      if (isHumanPrompt(record)) humanPrompts += 1;
      if (typeof record.sessionId === "string") {
        const set = sessionIdFiles.get(record.sessionId) ?? /* @__PURE__ */ new Set();
        set.add(file.basename);
        sessionIdFiles.set(record.sessionId, set);
      }
      const version = typeof record.version === "string" ? safeVersion(record.version) : null;
      if (version !== null) {
        if (minVersion === null || version.localeCompare(minVersion, "en", { numeric: true }) < 0) minVersion = version;
        if (maxVersion === null || version.localeCompare(maxVersion, "en", { numeric: true }) > 0) maxVersion = version;
      }
      if (record.type === "user" || record.type === "assistant") {
        if (typeof record.entrypoint === "string") {
          recordsWithEntrypoint += 1;
          const entry = safeEnumValue(record.entrypoint);
          entrypointValues.set(entry, (entrypointValues.get(entry) ?? 0) + 1);
        } else {
          recordsWithoutEntrypoint += 1;
        }
        if (typeof record.promptSource === "string") {
          const src = safeEnumValue(record.promptSource);
          promptSourceValues.set(src, (promptSourceValues.get(src) ?? 0) + 1);
        }
      }
      const message = record.message;
      if (typeof message === "object" && message !== null) {
        const usage = message.usage;
        if (typeof usage === "object" && usage !== null) {
          for (const k of Object.keys(usage)) usageKeys.add(safeKeyName(k));
        }
      }
      for (const { name, input } of toolUseBlocks(record)) {
        const redacted = redactToolName(name);
        toolCounts.set(redacted, (toolCounts.get(redacted) ?? 0) + 1);
        if (COUNTED_WRITERS.has(name)) {
          const shape = typeof input === "object" && input !== null && Object.keys(input).length > 0 ? Object.keys(input).map(safeKeyName).sort().join(",") : "(empty)";
          editShapes.set(`${name}|${shape}`, (editShapes.get(`${name}|${shape}`) ?? 0) + 1);
        }
      }
    }
    if (!file.isAgent && (humanPrompts < 1 || assistantTurns < 1)) stubs += 1;
  }
  return {
    files: {
      total: files.length,
      main: files.filter((f) => !f.isAgent).length,
      agent: files.filter((f) => f.isAgent).length,
      stubs
    },
    recordTypes: [...typeInfo.entries()].map(([type, i]) => ({ type, count: i.count, keys: [...i.keys].sort() })).sort((a, b) => b.count - a.count),
    editToolShapes: [...editShapes.entries()].map(([key, count]) => {
      const [tool, shape] = key.split("|");
      return { tool: tool ?? "", shape: shape ?? "", count };
    }).sort((a, b) => b.count - a.count),
    versionRange: minVersion !== null && maxVersion !== null ? [minVersion, maxVersion] : [null, null],
    gatedFields: {
      entrypointValues: Object.fromEntries(entrypointValues),
      promptSourceValues: Object.fromEntries(promptSourceValues),
      recordsWithEntrypoint,
      recordsWithoutEntrypoint
    },
    linkage: {
      sidechainRecords,
      compactBoundaries,
      reusedSessionIds: [...sessionIdFiles.values()].filter((s) => s.size > 1).length
    },
    toolCounts: [...toolCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    usageKeys: [...usageKeys].sort(),
    warnings: warnings.toJSON()
  };
}
var init_survey = __esm({
  "packages/core/src/survey.ts"() {
    "use strict";
    init_classify();
    init_loc();
    init_reader();
    init_sanitize();
    init_sessions();
    init_warnings();
  }
});

// packages/core/src/index.ts
var init_src = __esm({
  "packages/core/src/index.ts"() {
    "use strict";
    init_assemble();
    init_schema();
    init_reader();
    init_survey();
    init_buckets();
  }
});

// ../../../node_modules/.pnpm/picocolors@1.1.1/node_modules/picocolors/picocolors.js
var require_picocolors = __commonJS({
  "../../../node_modules/.pnpm/picocolors@1.1.1/node_modules/picocolors/picocolors.js"(exports2, module2) {
    var p = process || {};
    var argv = p.argv || [];
    var env = p.env || {};
    var isColorSupported = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
    var formatter = (open, close, replace = open) => (input) => {
      let string = "" + input, index = string.indexOf(close, open.length);
      return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
    };
    var replaceClose = (string, close, replace, index) => {
      let result = "", cursor = 0;
      do {
        result += string.substring(cursor, index) + replace;
        cursor = index + close.length;
        index = string.indexOf(close, cursor);
      } while (~index);
      return result + string.substring(cursor);
    };
    var createColors = (enabled = isColorSupported) => {
      let f = enabled ? formatter : () => String;
      return {
        isColorSupported: enabled,
        reset: f("\x1B[0m", "\x1B[0m"),
        bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
        dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
        italic: f("\x1B[3m", "\x1B[23m"),
        underline: f("\x1B[4m", "\x1B[24m"),
        inverse: f("\x1B[7m", "\x1B[27m"),
        hidden: f("\x1B[8m", "\x1B[28m"),
        strikethrough: f("\x1B[9m", "\x1B[29m"),
        black: f("\x1B[30m", "\x1B[39m"),
        red: f("\x1B[31m", "\x1B[39m"),
        green: f("\x1B[32m", "\x1B[39m"),
        yellow: f("\x1B[33m", "\x1B[39m"),
        blue: f("\x1B[34m", "\x1B[39m"),
        magenta: f("\x1B[35m", "\x1B[39m"),
        cyan: f("\x1B[36m", "\x1B[39m"),
        white: f("\x1B[37m", "\x1B[39m"),
        gray: f("\x1B[90m", "\x1B[39m"),
        bgBlack: f("\x1B[40m", "\x1B[49m"),
        bgRed: f("\x1B[41m", "\x1B[49m"),
        bgGreen: f("\x1B[42m", "\x1B[49m"),
        bgYellow: f("\x1B[43m", "\x1B[49m"),
        bgBlue: f("\x1B[44m", "\x1B[49m"),
        bgMagenta: f("\x1B[45m", "\x1B[49m"),
        bgCyan: f("\x1B[46m", "\x1B[49m"),
        bgWhite: f("\x1B[47m", "\x1B[49m"),
        blackBright: f("\x1B[90m", "\x1B[39m"),
        redBright: f("\x1B[91m", "\x1B[39m"),
        greenBright: f("\x1B[92m", "\x1B[39m"),
        yellowBright: f("\x1B[93m", "\x1B[39m"),
        blueBright: f("\x1B[94m", "\x1B[39m"),
        magentaBright: f("\x1B[95m", "\x1B[39m"),
        cyanBright: f("\x1B[96m", "\x1B[39m"),
        whiteBright: f("\x1B[97m", "\x1B[39m"),
        bgBlackBright: f("\x1B[100m", "\x1B[49m"),
        bgRedBright: f("\x1B[101m", "\x1B[49m"),
        bgGreenBright: f("\x1B[102m", "\x1B[49m"),
        bgYellowBright: f("\x1B[103m", "\x1B[49m"),
        bgBlueBright: f("\x1B[104m", "\x1B[49m"),
        bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
        bgCyanBright: f("\x1B[106m", "\x1B[49m"),
        bgWhiteBright: f("\x1B[107m", "\x1B[49m")
      };
    };
    module2.exports = createColors();
    module2.exports.createColors = createColors;
  }
});

// packages/cli/src/summary.ts
function formatCount(n) {
  if (n < 1e4) return n.toLocaleString("en-US");
  for (const [div, suffix] of [[1e3, "k"], [1e6, "M"], [1e9, "B"], [1e12, "T"]]) {
    const r = Math.round(n / div * 10) / 10;
    if (r < 1e3) return `${r}${suffix}`;
  }
  return `${Math.round(n / 1e12)}T`;
}
function truncate(s, max) {
  return s.length <= max ? s : `${s.slice(0, max - 1)}\u2026`;
}
function suspectWriterWarnings(metrics) {
  return metrics.source.parserWarnings.filter((w) => w.kind === "suspectedWriteTool").map(
    (w) => `\u26A0 tool ${w.tool} looks like it writes files but isn't counted (${w.count} calls) \u2014 run \`trackrecord doctor\` and open an issue.`
  );
}
function row(left, right = "", paintL = id, paintR = id) {
  const reserve = right ? right.length + 2 : 0;
  const l = left.length + reserve > W ? truncate(left, W - reserve) : left;
  const gap = " ".repeat(W - l.length - right.length);
  return `\u2502 ${paintL(l)}${gap}${paintR(right)} \u2502`;
}
function displayTool(name, max) {
  const suffix = name.match(/^mcp__<redacted>__(.+)$/)?.[1];
  if (suffix !== void 0) return `${truncate(suffix, max - 5)} (MCP)`;
  return truncate(name, max);
}
function renderSummary(metrics) {
  const { output, delivery, activity, tools, tokens, source } = metrics;
  const since = source.dateRange[0]?.slice(0, 10) ?? "\u2014";
  const until = source.dateRange[1]?.slice(0, 10) ?? "\u2014";
  const hero = (s) => import_picocolors.default.bold(import_picocolors.default.green(s));
  const dim = (s) => import_picocolors.default.dim(s);
  const bold = (s) => import_picocolors.default.bold(s);
  const ledger = (label, value, sub = "") => row(label.padEnd(17) + value, sub, (s) => import_picocolors.default.dim(s.slice(0, 17)) + import_picocolors.default.bold(s.slice(17)), dim);
  const topLangs = output.byLanguage.filter((l) => isCodeExt(l.lang)).slice(0, 3).map((l) => `${l.lang} ${formatCount(l.linesAdded)}`).join(" \xB7 ") || "\u2014";
  const topTool = tools.builtin[0];
  const totalTokens = tokens.input + tokens.output + tokens.cacheRead + tokens.cacheCreation;
  const lines = [
    TOP,
    row("TRACKRECORD", `since ${since} \u2192 ${until}`, bold, dim),
    row("THE RECORD BOOK \xB7 A LEDGER OF SHIPPED WORK", "", dim),
    MID,
    row("LINES OF CODE ADDED", "PULL REQUESTS SHIPPED", dim, dim),
    row(formatCount(output.linesAdded.code), formatCount(delivery.pullRequests), hero, bold),
    row(
      `+${formatCount(output.linesAdded.docs)} docs \xB7 ${formatCount(output.linesRemoved.total)} removed`,
      `across ${delivery.repositories} repos`,
      dim,
      dim
    ),
    MID,
    ledger("top languages", truncate(topLangs, 39)),
    ledger(
      "sessions",
      formatCount(activity.sessions),
      `${activity.activeDays} active days`
    ),
    ledger(
      "longest streak",
      `${activity.longestStreak}d`,
      activity.currentStreak > 0 ? `current ${activity.currentStreak}d` : ""
    ),
    ledger(
      "top tool",
      topTool ? displayTool(topTool.name, 20) : "\u2014",
      topTool ? `\xD7${formatCount(topTool.count)}` : ""
    ),
    ledger("context ceiling", `${formatCount(activity.compactions)}\xD7 hit`),
    ledger(
      "total tokens",
      formatCount(totalTokens),
      `$${tokens.apiEquivalentUsd.toFixed(2)} API-equiv`
    ),
    MID,
    row("built with Claude Code", "zero network calls", dim, dim),
    BOT
  ];
  return lines.join("\n");
}
var import_picocolors, W, id, TOP, MID, BOT;
var init_summary = __esm({
  "packages/cli/src/summary.ts"() {
    "use strict";
    import_picocolors = __toESM(require_picocolors(), 1);
    init_src();
    W = 58;
    id = (s) => s;
    TOP = `\u250C${"\u2500".repeat(W + 2)}\u2510`;
    MID = `\u251C${"\u2500".repeat(W + 2)}\u2524`;
    BOT = `\u2514${"\u2500".repeat(W + 2)}\u2518`;
  }
});

// packages/cli/src/card.ts
var card_exports = {};
__export(card_exports, {
  displayToolName: () => displayToolName,
  parseDateOptions: () => parseDateOptions,
  renderCardPng: () => renderCardPng,
  renderCardSvg: () => renderCardSvg,
  topLanguagesLine: () => topLanguagesLine
});
function h(type, style, ...children) {
  return { type, props: { style, children: children.length === 1 ? children[0] : children } };
}
function font(name) {
  return (0, import_node_fs3.readFileSync)(new URL(`../assets/${name}`, import_meta.url));
}
function stat(label, value, sub, valueSize = 30, nowrap = false) {
  return h(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      backgroundColor: PANEL,
      borderRadius: 12,
      padding: "16px 22px",
      flexGrow: 1,
      flexBasis: 0,
      height: 112,
      overflow: "hidden"
    },
    h("div", { display: "flex", fontSize: 17, color: DIM }, label),
    h(
      "div",
      { display: "flex", fontSize: valueSize, fontWeight: 800, color: INK, marginTop: 6, lineHeight: 1.2, ...nowrap ? { whiteSpace: "nowrap" } : {} },
      value
    ),
    ...sub ? [h("div", { display: "flex", fontSize: 15, color: DIM, marginTop: 2 }, sub)] : []
  );
}
function topLanguagesLine(byLanguage) {
  return byLanguage.filter((l) => isCodeExt(l.lang)).slice(0, 3).map((l) => `${l.lang} ${formatCount(l.linesAdded)}`).join(" \xB7 ") || "\u2014";
}
function displayToolName(name, max) {
  const suffix = name.match(/^mcp__<redacted>__(.+)$/)?.[1];
  if (suffix !== void 0) return `${truncate(suffix, max - 5)} (MCP)`;
  return truncate(name, max);
}
async function renderCardSvg(metrics) {
  const { output, delivery, activity, tools, tokens, source } = metrics;
  const since = source.dateRange[0]?.slice(0, 10) ?? "\u2014";
  const until = source.dateRange[1]?.slice(0, 10) ?? "\u2014";
  const topLangs = topLanguagesLine(output.byLanguage);
  const topTool = tools.builtin[0];
  const totalTokens = tokens.input + tokens.output + tokens.cacheRead + tokens.cacheCreation;
  const tree = h(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      height: "100%",
      backgroundColor: BG,
      color: INK,
      padding: "36px 48px",
      fontFamily: "JetBrains Mono"
    },
    // header
    h(
      "div",
      { display: "flex", justifyContent: "space-between", alignItems: "baseline", height: 38 },
      h("div", { display: "flex", fontSize: 28, fontWeight: 800 }, "trackrecord"),
      h("div", { display: "flex", fontSize: 20, color: DIM }, `${since} \u2192 ${until}`)
    ),
    // heroes
    h(
      "div",
      { display: "flex", gap: 24, marginTop: 20 },
      h(
        "div",
        { display: "flex", flexDirection: "column", flexGrow: 2, flexBasis: 0, backgroundColor: PANEL, borderRadius: 16, padding: "20px 30px", height: 158, overflow: "hidden" },
        h("div", { display: "flex", fontSize: 20, color: DIM }, "lines of code added"),
        h("div", { display: "flex", fontSize: 80, fontWeight: 800, color: ACCENT, lineHeight: 1.1 }, formatCount(output.linesAdded.code))
      ),
      h(
        "div",
        { display: "flex", flexDirection: "column", flexGrow: 1, flexBasis: 0, backgroundColor: PANEL, borderRadius: 16, padding: "20px 30px", height: 158, overflow: "hidden" },
        h("div", { display: "flex", fontSize: 20, color: DIM }, "PRs shipped"),
        h("div", { display: "flex", fontSize: 80, fontWeight: 800, lineHeight: 1.1 }, formatCount(delivery.pullRequests))
      )
    ),
    // stat grid — fixed heights so nothing can push the footer off-canvas
    h(
      "div",
      { display: "flex", gap: 16, marginTop: 16 },
      stat("top languages", topLangs, void 0, 21),
      stat("sessions", `${formatCount(activity.sessions)}`, `${activity.activeDays} active days`),
      stat("longest streak", `${activity.longestStreak}d`, activity.currentStreak > 0 ? `current ${activity.currentStreak}d` : void 0)
    ),
    h(
      "div",
      { display: "flex", gap: 16, marginTop: 14 },
      stat("top tool", topTool ? displayToolName(topTool.name, 16) : "\u2014", topTool ? `\xD7${formatCount(topTool.count)}` : void 0, 30, true),
      stat("context ceiling hit", `${formatCount(activity.compactions)}\xD7`),
      stat("total tokens", formatCount(totalTokens))
    ),
    // footer
    h(
      "div",
      { display: "flex", justifyContent: "space-between", marginTop: "auto", paddingTop: 12 },
      h("div", { display: "flex", fontSize: 17, color: DIM }, "built with Claude Code"),
      h("div", { display: "flex", fontSize: 17, color: DIM }, "trackrecord \xB7 zero network calls")
    )
  );
  return (0, import_satori.default)(tree, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: "JetBrains Mono", data: font("JetBrainsMono-Regular.ttf"), weight: 400, style: "normal" },
      { name: "JetBrains Mono", data: font("JetBrainsMono-ExtraBold.ttf"), weight: 800, style: "normal" }
    ]
  });
}
async function renderCardPng(metrics) {
  const svg = await renderCardSvg(metrics);
  const resvg = new import_resvg_js.Resvg(svg, { fitTo: { mode: "width", value: WIDTH } });
  return Buffer.from(resvg.render().asPng());
}
function parseDateOptions(opts) {
  if (opts.range) {
    const [from, to] = opts.range.split("..");
    if (!from || !to) throw new Error(`invalid --range "${opts.range}" \u2014 expected YYYY-MM-DD..YYYY-MM-DD`);
    return { since: /* @__PURE__ */ new Date(`${from}T00:00:00Z`), until: /* @__PURE__ */ new Date(`${to}T23:59:59.999Z`) };
  }
  if (opts.since) return { since: /* @__PURE__ */ new Date(`${opts.since}T00:00:00Z`) };
  return {};
}
var import_node_fs3, import_satori, import_resvg_js, import_meta, WIDTH, HEIGHT, INK, DIM, ACCENT, BG, PANEL;
var init_card = __esm({
  "packages/cli/src/card.ts"() {
    "use strict";
    import_node_fs3 = require("node:fs");
    import_satori = __toESM(require("satori"), 1);
    import_resvg_js = require("@resvg/resvg-js");
    init_src();
    init_summary();
    import_meta = {};
    WIDTH = 1200;
    HEIGHT = 630;
    INK = "#e8e6e3";
    DIM = "#8a8782";
    ACCENT = "#4ade80";
    BG = "#101312";
    PANEL = "#181c1a";
  }
});

// packages/cli/src/index.ts
var import_node_fs4 = require("node:fs");
var import_node_os = require("node:os");
var import_node_path5 = require("node:path");

// ../../../node_modules/.pnpm/commander@15.0.0/node_modules/commander/lib/error.js
var CommanderError = class extends Error {
  /**
   * Constructs the CommanderError class
   * @param {number} exitCode suggested exit code which could be used with process.exit
   * @param {string} code an id string representing the error
   * @param {string} message human-readable description of the error
   */
  constructor(exitCode, code, message) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.code = code;
    this.exitCode = exitCode;
    this.nestedError = void 0;
  }
};
var InvalidArgumentError = class extends CommanderError {
  /**
   * Constructs the InvalidArgumentError class
   * @param {string} [message] explanation of why argument is invalid
   */
  constructor(message) {
    super(1, "commander.invalidArgument", message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
  }
};

// ../../../node_modules/.pnpm/commander@15.0.0/node_modules/commander/lib/argument.js
var Argument = class {
  /**
   * Initialize a new command argument with the given name and description.
   * The default is that the argument is required, and you can explicitly
   * indicate this with <> around the name. Put [] around the name for an optional argument.
   *
   * @param {string} name
   * @param {string} [description]
   */
  constructor(name, description) {
    this.description = description || "";
    this.variadic = false;
    this.parseArg = void 0;
    this.defaultValue = void 0;
    this.defaultValueDescription = void 0;
    this.argChoices = void 0;
    switch (name[0]) {
      case "<":
        this.required = true;
        this._name = name.slice(1, -1);
        break;
      case "[":
        this.required = false;
        this._name = name.slice(1, -1);
        break;
      default:
        this.required = true;
        this._name = name;
        break;
    }
    if (this._name.endsWith("...")) {
      this.variadic = true;
      this._name = this._name.slice(0, -3);
    }
  }
  /**
   * Return argument name.
   *
   * @return {string}
   */
  name() {
    return this._name;
  }
  /**
   * @package
   */
  _collectValue(value, previous) {
    if (previous === this.defaultValue || !Array.isArray(previous)) {
      return [value];
    }
    previous.push(value);
    return previous;
  }
  /**
   * Set the default value, and optionally supply the description to be displayed in the help.
   *
   * @param {*} value
   * @param {string} [description]
   * @return {Argument}
   */
  default(value, description) {
    this.defaultValue = value;
    this.defaultValueDescription = description;
    return this;
  }
  /**
   * Set the custom handler for processing CLI command arguments into argument values.
   *
   * @param {Function} [fn]
   * @return {Argument}
   */
  argParser(fn) {
    this.parseArg = fn;
    return this;
  }
  /**
   * Only allow argument value to be one of choices.
   *
   * @param {string[]} values
   * @return {Argument}
   */
  choices(values) {
    this.argChoices = values.slice();
    this.parseArg = (arg, previous) => {
      if (!this.argChoices.includes(arg)) {
        throw new InvalidArgumentError(
          `Allowed choices are ${this.argChoices.join(", ")}.`
        );
      }
      if (this.variadic) {
        return this._collectValue(arg, previous);
      }
      return arg;
    };
    return this;
  }
  /**
   * Make argument required.
   *
   * @returns {Argument}
   */
  argRequired() {
    this.required = true;
    return this;
  }
  /**
   * Make argument optional.
   *
   * @returns {Argument}
   */
  argOptional() {
    this.required = false;
    return this;
  }
};
function humanReadableArgName(arg) {
  const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
  return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
}

// ../../../node_modules/.pnpm/commander@15.0.0/node_modules/commander/lib/command.js
var import_node_events = require("node:events");
var import_node_child_process = __toESM(require("node:child_process"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_process = __toESM(require("node:process"), 1);
var import_node_util2 = require("node:util");

// ../../../node_modules/.pnpm/commander@15.0.0/node_modules/commander/lib/help.js
var import_node_util = require("node:util");
var Help = class {
  constructor() {
    this.helpWidth = void 0;
    this.minWidthToWrap = 40;
    this.sortSubcommands = false;
    this.sortOptions = false;
    this.showGlobalOptions = false;
  }
  /**
   * prepareContext is called by Commander after applying overrides from `Command.configureHelp()`
   * and just before calling `formatHelp()`.
   *
   * Commander just uses the helpWidth and the rest is provided for optional use by more complex subclasses.
   *
   * @param {{ error?: boolean, helpWidth?: number, outputHasColors?: boolean }} contextOptions
   */
  prepareContext(contextOptions) {
    this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
  }
  /**
   * Get an array of the visible subcommands. Includes a placeholder for the implicit help command, if there is one.
   *
   * @param {Command} cmd
   * @returns {Command[]}
   */
  visibleCommands(cmd) {
    const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
    const helpCommand = cmd._getHelpCommand();
    if (helpCommand && !helpCommand._hidden) {
      visibleCommands.push(helpCommand);
    }
    if (this.sortSubcommands) {
      visibleCommands.sort((a, b) => {
        return a.name().localeCompare(b.name());
      });
    }
    return visibleCommands;
  }
  /**
   * Compare options for sort.
   *
   * @param {Option} a
   * @param {Option} b
   * @returns {number}
   */
  compareOptions(a, b) {
    const getSortKey = (option) => {
      return option.short ? option.short.replace(/^-/, "") : option.long.replace(/^--/, "");
    };
    return getSortKey(a).localeCompare(getSortKey(b));
  }
  /**
   * Get an array of the visible options. Includes a placeholder for the implicit help option, if there is one.
   *
   * @param {Command} cmd
   * @returns {Option[]}
   */
  visibleOptions(cmd) {
    const visibleOptions = cmd.options.filter((option) => !option.hidden);
    const helpOption = cmd._getHelpOption();
    if (helpOption && !helpOption.hidden) {
      const removeShort = helpOption.short && cmd._findOption(helpOption.short);
      const removeLong = helpOption.long && cmd._findOption(helpOption.long);
      if (!removeShort && !removeLong) {
        visibleOptions.push(helpOption);
      } else if (helpOption.long && !removeLong) {
        visibleOptions.push(
          cmd.createOption(helpOption.long, helpOption.description)
        );
      } else if (helpOption.short && !removeShort) {
        visibleOptions.push(
          cmd.createOption(helpOption.short, helpOption.description)
        );
      }
    }
    if (this.sortOptions) {
      visibleOptions.sort(this.compareOptions);
    }
    return visibleOptions;
  }
  /**
   * Get an array of the visible global options. (Not including help.)
   *
   * @param {Command} cmd
   * @returns {Option[]}
   */
  visibleGlobalOptions(cmd) {
    if (!this.showGlobalOptions) return [];
    const globalOptions = [];
    for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
      const visibleOptions = ancestorCmd.options.filter(
        (option) => !option.hidden
      );
      globalOptions.push(...visibleOptions);
    }
    if (this.sortOptions) {
      globalOptions.sort(this.compareOptions);
    }
    return globalOptions;
  }
  /**
   * Get an array of the arguments if any have a description.
   *
   * @param {Command} cmd
   * @returns {Argument[]}
   */
  visibleArguments(cmd) {
    if (cmd._argsDescription) {
      cmd.registeredArguments.forEach((argument) => {
        argument.description = argument.description || cmd._argsDescription[argument.name()] || "";
      });
    }
    if (cmd.registeredArguments.find((argument) => argument.description)) {
      return cmd.registeredArguments;
    }
    return [];
  }
  /**
   * Get the command term to show in the list of subcommands.
   *
   * @param {Command} cmd
   * @returns {string}
   */
  subcommandTerm(cmd) {
    const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(" ");
    return cmd._name + (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") + (cmd.options.length ? " [options]" : "") + // simplistic check for non-help option
    (args ? " " + args : "");
  }
  /**
   * Get the option term to show in the list of options.
   *
   * @param {Option} option
   * @returns {string}
   */
  optionTerm(option) {
    return option.flags;
  }
  /**
   * Get the argument term to show in the list of arguments.
   *
   * @param {Argument} argument
   * @returns {string}
   */
  argumentTerm(argument) {
    return argument.name();
  }
  /**
   * Get the longest command term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */
  longestSubcommandTermLength(cmd, helper) {
    return helper.visibleCommands(cmd).reduce((max, command) => {
      return Math.max(
        max,
        this.displayWidth(
          helper.styleSubcommandTerm(helper.subcommandTerm(command))
        )
      );
    }, 0);
  }
  /**
   * Get the longest option term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */
  longestOptionTermLength(cmd, helper) {
    return helper.visibleOptions(cmd).reduce((max, option) => {
      return Math.max(
        max,
        this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option)))
      );
    }, 0);
  }
  /**
   * Get the longest global option term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */
  longestGlobalOptionTermLength(cmd, helper) {
    return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
      return Math.max(
        max,
        this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option)))
      );
    }, 0);
  }
  /**
   * Get the longest argument term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */
  longestArgumentTermLength(cmd, helper) {
    return helper.visibleArguments(cmd).reduce((max, argument) => {
      return Math.max(
        max,
        this.displayWidth(
          helper.styleArgumentTerm(helper.argumentTerm(argument))
        )
      );
    }, 0);
  }
  /**
   * Get the command usage to be displayed at the top of the built-in help.
   *
   * @param {Command} cmd
   * @returns {string}
   */
  commandUsage(cmd) {
    let cmdName = cmd._name;
    if (cmd._aliases[0]) {
      cmdName = cmdName + "|" + cmd._aliases[0];
    }
    let ancestorCmdNames = "";
    for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
      ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
    }
    return ancestorCmdNames + cmdName + " " + cmd.usage();
  }
  /**
   * Get the description for the command.
   *
   * @param {Command} cmd
   * @returns {string}
   */
  commandDescription(cmd) {
    return cmd.description();
  }
  /**
   * Get the subcommand summary to show in the list of subcommands.
   * (Fallback to description for backwards compatibility.)
   *
   * @param {Command} cmd
   * @returns {string}
   */
  subcommandDescription(cmd) {
    return cmd.summary() || cmd.description();
  }
  /**
   * Get the option description to show in the list of options.
   *
   * @param {Option} option
   * @return {string}
   */
  optionDescription(option) {
    const extraInfo = [];
    if (option.argChoices) {
      extraInfo.push(
        // use stringify to match the display of the default value
        `choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
      );
    }
    if (option.defaultValue !== void 0) {
      const showDefault = option.required || option.optional || option.isBoolean() && typeof option.defaultValue === "boolean";
      if (showDefault) {
        extraInfo.push(
          `default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`
        );
      }
    }
    if (option.presetArg !== void 0 && option.optional) {
      extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
    }
    if (option.envVar !== void 0) {
      extraInfo.push(`env: ${option.envVar}`);
    }
    if (extraInfo.length > 0) {
      const extraDescription = `(${extraInfo.join(", ")})`;
      if (option.description) {
        return `${option.description} ${extraDescription}`;
      }
      return extraDescription;
    }
    return option.description;
  }
  /**
   * Get the argument description to show in the list of arguments.
   *
   * @param {Argument} argument
   * @return {string}
   */
  argumentDescription(argument) {
    const extraInfo = [];
    if (argument.argChoices) {
      extraInfo.push(
        // use stringify to match the display of the default value
        `choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
      );
    }
    if (argument.defaultValue !== void 0) {
      extraInfo.push(
        `default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`
      );
    }
    if (extraInfo.length > 0) {
      const extraDescription = `(${extraInfo.join(", ")})`;
      if (argument.description) {
        return `${argument.description} ${extraDescription}`;
      }
      return extraDescription;
    }
    return argument.description;
  }
  /**
   * Format a list of items, given a heading and an array of formatted items.
   *
   * @param {string} heading
   * @param {string[]} items
   * @param {Help} helper
   * @returns string[]
   */
  formatItemList(heading, items, helper) {
    if (items.length === 0) return [];
    return [helper.styleTitle(heading), ...items, ""];
  }
  /**
   * Group items by their help group heading.
   *
   * @param {Command[] | Option[]} unsortedItems
   * @param {Command[] | Option[]} visibleItems
   * @param {Function} getGroup
   * @returns {Map<string, Command[] | Option[]>}
   */
  groupItems(unsortedItems, visibleItems, getGroup) {
    const result = /* @__PURE__ */ new Map();
    unsortedItems.forEach((item) => {
      const group = getGroup(item);
      if (!result.has(group)) result.set(group, []);
    });
    visibleItems.forEach((item) => {
      const group = getGroup(item);
      if (!result.has(group)) {
        result.set(group, []);
      }
      result.get(group).push(item);
    });
    return result;
  }
  /**
   * Generate the built-in help text.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {string}
   */
  formatHelp(cmd, helper) {
    const termWidth = helper.padWidth(cmd, helper);
    const helpWidth = helper.helpWidth ?? 80;
    function callFormatItem(term, description) {
      return helper.formatItem(term, termWidth, description, helper);
    }
    let output = [
      `${helper.styleTitle("Usage:")} ${helper.styleUsage(helper.commandUsage(cmd))}`,
      ""
    ];
    const commandDescription = helper.commandDescription(cmd);
    if (commandDescription.length > 0) {
      output = output.concat([
        helper.boxWrap(
          helper.styleCommandDescription(commandDescription),
          helpWidth
        ),
        ""
      ]);
    }
    const argumentList = helper.visibleArguments(cmd).map((argument) => {
      return callFormatItem(
        helper.styleArgumentTerm(helper.argumentTerm(argument)),
        helper.styleArgumentDescription(helper.argumentDescription(argument))
      );
    });
    output = output.concat(
      this.formatItemList("Arguments:", argumentList, helper)
    );
    const optionGroups = this.groupItems(
      cmd.options,
      helper.visibleOptions(cmd),
      (option) => option.helpGroupHeading ?? "Options:"
    );
    optionGroups.forEach((options, group) => {
      const optionList = options.map((option) => {
        return callFormatItem(
          helper.styleOptionTerm(helper.optionTerm(option)),
          helper.styleOptionDescription(helper.optionDescription(option))
        );
      });
      output = output.concat(this.formatItemList(group, optionList, helper));
    });
    if (helper.showGlobalOptions) {
      const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
        return callFormatItem(
          helper.styleOptionTerm(helper.optionTerm(option)),
          helper.styleOptionDescription(helper.optionDescription(option))
        );
      });
      output = output.concat(
        this.formatItemList("Global Options:", globalOptionList, helper)
      );
    }
    const commandGroups = this.groupItems(
      cmd.commands,
      helper.visibleCommands(cmd),
      (sub) => sub.helpGroup() || "Commands:"
    );
    commandGroups.forEach((commands, group) => {
      const commandList = commands.map((sub) => {
        return callFormatItem(
          helper.styleSubcommandTerm(helper.subcommandTerm(sub)),
          helper.styleSubcommandDescription(helper.subcommandDescription(sub))
        );
      });
      output = output.concat(this.formatItemList(group, commandList, helper));
    });
    return output.join("\n");
  }
  /**
   * Return display width of string, ignoring ANSI escape sequences. Used in padding and wrapping calculations.
   *
   * @param {string} str
   * @returns {number}
   */
  displayWidth(str2) {
    return (0, import_node_util.stripVTControlCharacters)(str2).length;
  }
  /**
   * Style the title for displaying in the help. Called with 'Usage:', 'Options:', etc.
   *
   * @param {string} str
   * @returns {string}
   */
  styleTitle(str2) {
    return str2;
  }
  styleUsage(str2) {
    return str2.split(" ").map((word) => {
      if (word === "[options]") return this.styleOptionText(word);
      if (word === "[command]") return this.styleSubcommandText(word);
      if (word[0] === "[" || word[0] === "<")
        return this.styleArgumentText(word);
      return this.styleCommandText(word);
    }).join(" ");
  }
  styleCommandDescription(str2) {
    return this.styleDescriptionText(str2);
  }
  styleOptionDescription(str2) {
    return this.styleDescriptionText(str2);
  }
  styleSubcommandDescription(str2) {
    return this.styleDescriptionText(str2);
  }
  styleArgumentDescription(str2) {
    return this.styleDescriptionText(str2);
  }
  styleDescriptionText(str2) {
    return str2;
  }
  styleOptionTerm(str2) {
    return this.styleOptionText(str2);
  }
  styleSubcommandTerm(str2) {
    return str2.split(" ").map((word) => {
      if (word === "[options]") return this.styleOptionText(word);
      if (word[0] === "[" || word[0] === "<")
        return this.styleArgumentText(word);
      return this.styleSubcommandText(word);
    }).join(" ");
  }
  styleArgumentTerm(str2) {
    return this.styleArgumentText(str2);
  }
  styleOptionText(str2) {
    return str2;
  }
  styleArgumentText(str2) {
    return str2;
  }
  styleSubcommandText(str2) {
    return str2;
  }
  styleCommandText(str2) {
    return str2;
  }
  /**
   * Calculate the pad width from the maximum term length.
   *
   * @param {Command} cmd
   * @param {Help} helper
   * @returns {number}
   */
  padWidth(cmd, helper) {
    return Math.max(
      helper.longestOptionTermLength(cmd, helper),
      helper.longestGlobalOptionTermLength(cmd, helper),
      helper.longestSubcommandTermLength(cmd, helper),
      helper.longestArgumentTermLength(cmd, helper)
    );
  }
  /**
   * Detect manually wrapped and indented strings by checking for line break followed by whitespace.
   *
   * @param {string} str
   * @returns {boolean}
   */
  preformatted(str2) {
    return /\n[^\S\r\n]/.test(str2);
  }
  /**
   * Format the "item", which consists of a term and description. Pad the term and wrap the description, indenting the following lines.
   *
   * So "TTT", 5, "DDD DDDD DD DDD" might be formatted for this.helpWidth=17 like so:
   *   TTT  DDD DDDD
   *        DD DDD
   *
   * @param {string} term
   * @param {number} termWidth
   * @param {string} description
   * @param {Help} helper
   * @returns {string}
   */
  formatItem(term, termWidth, description, helper) {
    const itemIndent = 2;
    const itemIndentStr = " ".repeat(itemIndent);
    if (!description) return itemIndentStr + term;
    const paddedTerm = term.padEnd(
      termWidth + term.length - helper.displayWidth(term)
    );
    const spacerWidth = 2;
    const helpWidth = this.helpWidth ?? 80;
    const remainingWidth = helpWidth - termWidth - spacerWidth - itemIndent;
    let formattedDescription;
    if (remainingWidth < this.minWidthToWrap || helper.preformatted(description)) {
      formattedDescription = description;
    } else {
      const wrappedDescription = helper.boxWrap(description, remainingWidth);
      formattedDescription = wrappedDescription.replace(
        /\n/g,
        "\n" + " ".repeat(termWidth + spacerWidth)
      );
    }
    return itemIndentStr + paddedTerm + " ".repeat(spacerWidth) + formattedDescription.replace(/\n/g, `
${itemIndentStr}`);
  }
  /**
   * Wrap a string at whitespace, preserving existing line breaks.
   * Wrapping is skipped if the width is less than `minWidthToWrap`.
   *
   * @param {string} str
   * @param {number} width
   * @returns {string}
   */
  boxWrap(str2, width) {
    if (width < this.minWidthToWrap) return str2;
    const rawLines = str2.split(/\r\n|\n/);
    const chunkPattern = /[\s]*[^\s]+/g;
    const wrappedLines = [];
    rawLines.forEach((line) => {
      const chunks = line.match(chunkPattern);
      if (chunks === null) {
        wrappedLines.push("");
        return;
      }
      let sumChunks = [chunks.shift()];
      let sumWidth = this.displayWidth(sumChunks[0]);
      chunks.forEach((chunk) => {
        const visibleWidth = this.displayWidth(chunk);
        if (sumWidth + visibleWidth <= width) {
          sumChunks.push(chunk);
          sumWidth += visibleWidth;
          return;
        }
        wrappedLines.push(sumChunks.join(""));
        const nextChunk = chunk.trimStart();
        sumChunks = [nextChunk];
        sumWidth = this.displayWidth(nextChunk);
      });
      wrappedLines.push(sumChunks.join(""));
    });
    return wrappedLines.join("\n");
  }
};

// ../../../node_modules/.pnpm/commander@15.0.0/node_modules/commander/lib/option.js
var Option = class {
  /**
   * Initialize a new `Option` with the given `flags` and `description`.
   *
   * @param {string} flags
   * @param {string} [description]
   */
  constructor(flags, description) {
    this.flags = flags;
    this.description = description || "";
    this.required = flags.includes("<");
    this.optional = flags.includes("[");
    this.variadic = /\w\.\.\.[>\]]$/.test(flags);
    this.mandatory = false;
    const optionFlags = splitOptionFlags(flags);
    this.short = optionFlags.shortFlag;
    this.long = optionFlags.longFlag;
    this.negate = false;
    if (this.long) {
      this.negate = this.long.startsWith("--no-");
    }
    this.defaultValue = void 0;
    this.defaultValueDescription = void 0;
    this.presetArg = void 0;
    this.envVar = void 0;
    this.parseArg = void 0;
    this.hidden = false;
    this.argChoices = void 0;
    this.conflictsWith = [];
    this.implied = void 0;
    this.helpGroupHeading = void 0;
  }
  /**
   * Set the default value, and optionally supply the description to be displayed in the help.
   *
   * @param {*} value
   * @param {string} [description]
   * @return {Option}
   */
  default(value, description) {
    this.defaultValue = value;
    this.defaultValueDescription = description;
    return this;
  }
  /**
   * Preset to use when option used without option-argument, especially optional but also boolean and negated.
   * The custom processing (parseArg) is called.
   *
   * @example
   * new Option('--color').default('GREYSCALE').preset('RGB');
   * new Option('--donate [amount]').preset('20').argParser(parseFloat);
   *
   * @param {*} arg
   * @return {Option}
   */
  preset(arg) {
    this.presetArg = arg;
    return this;
  }
  /**
   * Add option name(s) that conflict with this option.
   * An error will be displayed if conflicting options are found during parsing.
   *
   * @example
   * new Option('--rgb').conflicts('cmyk');
   * new Option('--js').conflicts(['ts', 'jsx']);
   *
   * @param {(string | string[])} names
   * @return {Option}
   */
  conflicts(names) {
    this.conflictsWith = this.conflictsWith.concat(names);
    return this;
  }
  /**
   * Specify implied option values for when this option is set and the implied options are not.
   *
   * The custom processing (parseArg) is not called on the implied values.
   *
   * @example
   * program
   *   .addOption(new Option('--log', 'write logging information to file'))
   *   .addOption(new Option('--trace', 'log extra details').implies({ log: 'trace.txt' }));
   *
   * @param {object} impliedOptionValues
   * @return {Option}
   */
  implies(impliedOptionValues) {
    let newImplied = impliedOptionValues;
    if (typeof impliedOptionValues === "string") {
      newImplied = { [impliedOptionValues]: true };
    }
    this.implied = Object.assign(this.implied || {}, newImplied);
    return this;
  }
  /**
   * Set environment variable to check for option value.
   *
   * An environment variable is only used if when processed the current option value is
   * undefined, or the source of the current value is 'default' or 'config' or 'env'.
   *
   * @param {string} name
   * @return {Option}
   */
  env(name) {
    this.envVar = name;
    return this;
  }
  /**
   * Set the custom handler for processing CLI option arguments into option values.
   *
   * @param {Function} [fn]
   * @return {Option}
   */
  argParser(fn) {
    this.parseArg = fn;
    return this;
  }
  /**
   * Whether the option is mandatory and must have a value after parsing.
   *
   * @param {boolean} [mandatory=true]
   * @return {Option}
   */
  makeOptionMandatory(mandatory = true) {
    this.mandatory = !!mandatory;
    return this;
  }
  /**
   * Hide option in help.
   *
   * @param {boolean} [hide=true]
   * @return {Option}
   */
  hideHelp(hide = true) {
    this.hidden = !!hide;
    return this;
  }
  /**
   * @package
   */
  _collectValue(value, previous) {
    if (previous === this.defaultValue || !Array.isArray(previous)) {
      return [value];
    }
    previous.push(value);
    return previous;
  }
  /**
   * Only allow option value to be one of choices.
   *
   * @param {string[]} values
   * @return {Option}
   */
  choices(values) {
    this.argChoices = values.slice();
    this.parseArg = (arg, previous) => {
      if (!this.argChoices.includes(arg)) {
        throw new InvalidArgumentError(
          `Allowed choices are ${this.argChoices.join(", ")}.`
        );
      }
      if (this.variadic) {
        return this._collectValue(arg, previous);
      }
      return arg;
    };
    return this;
  }
  /**
   * Return option name.
   *
   * @return {string}
   */
  name() {
    if (this.long) {
      return this.long.replace(/^--/, "");
    }
    return this.short.replace(/^-/, "");
  }
  /**
   * Return option name, in a camelcase format that can be used
   * as an object attribute key.
   *
   * @return {string}
   */
  attributeName() {
    if (this.negate) {
      return camelcase(this.name().replace(/^no-/, ""));
    }
    return camelcase(this.name());
  }
  /**
   * Set the help group heading.
   *
   * @param {string} heading
   * @return {Option}
   */
  helpGroup(heading) {
    this.helpGroupHeading = heading;
    return this;
  }
  /**
   * Check if `arg` matches the short or long flag.
   *
   * @param {string} arg
   * @return {boolean}
   * @package
   */
  is(arg) {
    return this.short === arg || this.long === arg;
  }
  /**
   * Return whether a boolean option.
   *
   * Options are one of boolean, negated, required argument, or optional argument.
   *
   * @return {boolean}
   * @package
   */
  isBoolean() {
    return !this.required && !this.optional && !this.negate;
  }
};
var DualOptions = class {
  /**
   * @param {Option[]} options
   */
  constructor(options) {
    this.positiveOptions = /* @__PURE__ */ new Map();
    this.negativeOptions = /* @__PURE__ */ new Map();
    this.dualOptions = /* @__PURE__ */ new Set();
    options.forEach((option) => {
      if (option.negate) {
        this.negativeOptions.set(option.attributeName(), option);
      } else {
        this.positiveOptions.set(option.attributeName(), option);
      }
    });
    this.negativeOptions.forEach((value, key) => {
      if (this.positiveOptions.has(key)) {
        this.dualOptions.add(key);
      }
    });
  }
  /**
   * Did the value come from the option, and not from possible matching dual option?
   *
   * @param {*} value
   * @param {Option} option
   * @returns {boolean}
   */
  valueFromOption(value, option) {
    const optionKey = option.attributeName();
    if (!this.dualOptions.has(optionKey)) return true;
    const preset = this.negativeOptions.get(optionKey).presetArg;
    const negativeValue = preset !== void 0 ? preset : false;
    return option.negate === (negativeValue === value);
  }
};
function camelcase(str2) {
  return str2.split("-").reduce((str3, word) => {
    return str3 + word[0].toUpperCase() + word.slice(1);
  });
}
function splitOptionFlags(flags) {
  let shortFlag;
  let longFlag;
  const shortFlagExp = /^-[^-]$/;
  const longFlagExp = /^--[^-]/;
  const flagParts = flags.split(/[ |,]+/).concat("guard");
  if (shortFlagExp.test(flagParts[0])) shortFlag = flagParts.shift();
  if (longFlagExp.test(flagParts[0])) longFlag = flagParts.shift();
  if (!shortFlag && shortFlagExp.test(flagParts[0]))
    shortFlag = flagParts.shift();
  if (!shortFlag && longFlagExp.test(flagParts[0])) {
    shortFlag = longFlag;
    longFlag = flagParts.shift();
  }
  if (flagParts[0].startsWith("-")) {
    const unsupportedFlag = flagParts[0];
    const baseError = `option creation failed due to '${unsupportedFlag}' in option flags '${flags}'`;
    if (/^-[^-][^-]/.test(unsupportedFlag))
      throw new Error(
        `${baseError}
- a short flag is a single dash and a single character
  - either use a single dash and a single character (for a short flag)
  - or use a double dash for a long option (and can have two, like '--ws, --workspace')`
      );
    if (shortFlagExp.test(unsupportedFlag))
      throw new Error(`${baseError}
- too many short flags`);
    if (longFlagExp.test(unsupportedFlag))
      throw new Error(`${baseError}
- too many long flags`);
    throw new Error(`${baseError}
- unrecognised flag format`);
  }
  if (shortFlag === void 0 && longFlag === void 0)
    throw new Error(
      `option creation failed due to no flags found in '${flags}'.`
    );
  return { shortFlag, longFlag };
}

// ../../../node_modules/.pnpm/commander@15.0.0/node_modules/commander/lib/suggestSimilar.js
var maxDistance = 3;
function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > maxDistance)
    return Math.max(a.length, b.length);
  const d = [];
  for (let i = 0; i <= a.length; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    d[0][j] = j;
  }
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      let cost;
      if (a[i - 1] === b[j - 1]) {
        cost = 0;
      } else {
        cost = 1;
      }
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        // deletion
        d[i][j - 1] + 1,
        // insertion
        d[i - 1][j - 1] + cost
        // substitution
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}
function suggestSimilar(word, candidates) {
  if (!candidates || candidates.length === 0) return "";
  candidates = Array.from(new Set(candidates));
  const searchingOptions = word.startsWith("--");
  if (searchingOptions) {
    word = word.slice(2);
    candidates = candidates.map((candidate) => candidate.slice(2));
  }
  let similar = [];
  let bestDistance = maxDistance;
  const minSimilarity = 0.4;
  candidates.forEach((candidate) => {
    if (candidate.length <= 1) return;
    const distance = editDistance(word, candidate);
    const length = Math.max(word.length, candidate.length);
    const similarity = (length - distance) / length;
    if (similarity > minSimilarity) {
      if (distance < bestDistance) {
        bestDistance = distance;
        similar = [candidate];
      } else if (distance === bestDistance) {
        similar.push(candidate);
      }
    }
  });
  similar.sort((a, b) => a.localeCompare(b));
  if (searchingOptions) {
    similar = similar.map((candidate) => `--${candidate}`);
  }
  if (similar.length > 1) {
    return `
(Did you mean one of ${similar.join(", ")}?)`;
  }
  if (similar.length === 1) {
    return `
(Did you mean ${similar[0]}?)`;
  }
  return "";
}

// ../../../node_modules/.pnpm/commander@15.0.0/node_modules/commander/lib/command.js
var Command = class _Command extends import_node_events.EventEmitter {
  /**
   * Initialize a new `Command`.
   *
   * @param {string} [name]
   */
  constructor(name) {
    super();
    this.commands = [];
    this.options = [];
    this.parent = null;
    this._allowUnknownOption = false;
    this._allowExcessArguments = false;
    this.registeredArguments = [];
    this._args = this.registeredArguments;
    this.args = [];
    this.rawArgs = [];
    this.processedArgs = [];
    this._scriptPath = null;
    this._name = name || "";
    this._optionValues = {};
    this._optionValueSources = {};
    this._storeOptionsAsProperties = false;
    this._actionHandler = null;
    this._executableHandler = false;
    this._executableFile = null;
    this._executableDir = null;
    this._defaultCommandName = null;
    this._exitCallback = null;
    this._aliases = [];
    this._combineFlagAndOptionalValue = true;
    this._description = "";
    this._summary = "";
    this._argsDescription = void 0;
    this._enablePositionalOptions = false;
    this._passThroughOptions = false;
    this._lifeCycleHooks = {};
    this._showHelpAfterError = false;
    this._showSuggestionAfterError = true;
    this._savedState = null;
    this._outputConfiguration = {
      writeOut: (str2) => import_node_process.default.stdout.write(str2),
      writeErr: (str2) => import_node_process.default.stderr.write(str2),
      outputError: (str2, write) => write(str2),
      getOutHelpWidth: () => import_node_process.default.stdout.isTTY ? import_node_process.default.stdout.columns : void 0,
      getErrHelpWidth: () => import_node_process.default.stderr.isTTY ? import_node_process.default.stderr.columns : void 0,
      getOutHasColors: () => useColor() ?? (import_node_process.default.stdout.isTTY && import_node_process.default.stdout.hasColors?.()),
      getErrHasColors: () => useColor() ?? (import_node_process.default.stderr.isTTY && import_node_process.default.stderr.hasColors?.()),
      stripColor: (str2) => (0, import_node_util2.stripVTControlCharacters)(str2)
    };
    this._hidden = false;
    this._helpOption = void 0;
    this._addImplicitHelpCommand = void 0;
    this._helpCommand = void 0;
    this._helpConfiguration = {};
    this._helpGroupHeading = void 0;
    this._defaultCommandGroup = void 0;
    this._defaultOptionGroup = void 0;
  }
  /**
   * Copy settings that are useful to have in common across root command and subcommands.
   *
   * (Used internally when adding a command using `.command()` so subcommands inherit parent settings.)
   *
   * @param {Command} sourceCommand
   * @return {Command} `this` command for chaining
   */
  copyInheritedSettings(sourceCommand) {
    this._outputConfiguration = sourceCommand._outputConfiguration;
    this._helpOption = sourceCommand._helpOption;
    this._helpCommand = sourceCommand._helpCommand;
    this._helpConfiguration = sourceCommand._helpConfiguration;
    this._exitCallback = sourceCommand._exitCallback;
    this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
    this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
    this._allowExcessArguments = sourceCommand._allowExcessArguments;
    this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
    this._showHelpAfterError = sourceCommand._showHelpAfterError;
    this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
    return this;
  }
  /**
   * @returns {Command[]}
   * @private
   */
  _getCommandAndAncestors() {
    const result = [];
    for (let command = this; command; command = command.parent) {
      result.push(command);
    }
    return result;
  }
  /**
   * Define a command.
   *
   * There are two styles of command: pay attention to where to put the description.
   *
   * @example
   * // Command implemented using action handler (description is supplied separately to `.command`)
   * program
   *   .command('clone <source> [destination]')
   *   .description('clone a repository into a newly created directory')
   *   .action((source, destination) => {
   *     console.log('clone command called');
   *   });
   *
   * // Command implemented using separate executable file (description is second parameter to `.command`)
   * program
   *   .command('start <service>', 'start named service')
   *   .command('stop [service]', 'stop named service, or all if no name supplied');
   *
   * @param {string} nameAndArgs - command name and arguments, args are `<required>` or `[optional]` and last may also be `variadic...`
   * @param {(object | string)} [actionOptsOrExecDesc] - configuration options (for action), or description (for executable)
   * @param {object} [execOpts] - configuration options (for executable)
   * @return {Command} returns new command for action handler, or `this` for executable command
   */
  command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
    let desc = actionOptsOrExecDesc;
    let opts = execOpts;
    if (typeof desc === "object" && desc !== null) {
      opts = desc;
      desc = null;
    }
    opts = opts || {};
    const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
    const cmd = this.createCommand(name);
    if (desc) {
      cmd.description(desc);
      cmd._executableHandler = true;
    }
    if (opts.isDefault) this._defaultCommandName = cmd._name;
    cmd._hidden = !!(opts.noHelp || opts.hidden);
    cmd._executableFile = opts.executableFile || null;
    if (args) cmd.arguments(args);
    this._registerCommand(cmd);
    cmd.parent = this;
    cmd.copyInheritedSettings(this);
    if (desc) return this;
    return cmd;
  }
  /**
   * Factory routine to create a new unattached command.
   *
   * See .command() for creating an attached subcommand, which uses this routine to
   * create the command. You can override createCommand to customise subcommands.
   *
   * @param {string} [name]
   * @return {Command} new command
   */
  createCommand(name) {
    return new _Command(name);
  }
  /**
   * You can customise the help with a subclass of Help by overriding createHelp,
   * or by overriding Help properties using configureHelp().
   *
   * @return {Help}
   */
  createHelp() {
    return Object.assign(new Help(), this.configureHelp());
  }
  /**
   * You can customise the help by overriding Help properties using configureHelp(),
   * or with a subclass of Help by overriding createHelp().
   *
   * @param {object} [configuration] - configuration options
   * @return {(Command | object)} `this` command for chaining, or stored configuration
   */
  configureHelp(configuration) {
    if (configuration === void 0) return this._helpConfiguration;
    this._helpConfiguration = configuration;
    return this;
  }
  /**
   * The default output goes to stdout and stderr. You can customise this for special
   * applications. You can also customise the display of errors by overriding outputError.
   *
   * The configuration properties are all functions:
   *
   *     // change how output being written, defaults to stdout and stderr
   *     writeOut(str)
   *     writeErr(str)
   *     // change how output being written for errors, defaults to writeErr
   *     outputError(str, write) // used for displaying errors and not used for displaying help
   *     // specify width for wrapping help
   *     getOutHelpWidth()
   *     getErrHelpWidth()
   *     // color support, currently only used with Help
   *     getOutHasColors()
   *     getErrHasColors()
   *     stripColor() // used to remove ANSI escape codes if output does not have colors
   *
   * @param {object} [configuration] - configuration options
   * @return {(Command | object)} `this` command for chaining, or stored configuration
   */
  configureOutput(configuration) {
    if (configuration === void 0) return this._outputConfiguration;
    this._outputConfiguration = {
      ...this._outputConfiguration,
      ...configuration
    };
    return this;
  }
  /**
   * Display the help or a custom message after an error occurs.
   *
   * @param {(boolean|string)} [displayHelp]
   * @return {Command} `this` command for chaining
   */
  showHelpAfterError(displayHelp = true) {
    if (typeof displayHelp !== "string") displayHelp = !!displayHelp;
    this._showHelpAfterError = displayHelp;
    return this;
  }
  /**
   * Display suggestion of similar commands for unknown commands, or options for unknown options.
   *
   * @param {boolean} [displaySuggestion]
   * @return {Command} `this` command for chaining
   */
  showSuggestionAfterError(displaySuggestion = true) {
    this._showSuggestionAfterError = !!displaySuggestion;
    return this;
  }
  /**
   * Add a prepared subcommand.
   *
   * See .command() for creating an attached subcommand which inherits settings from its parent.
   *
   * @param {Command} cmd - new subcommand
   * @param {object} [opts] - configuration options
   * @return {Command} `this` command for chaining
   */
  addCommand(cmd, opts) {
    if (!cmd._name) {
      throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
    }
    opts = opts || {};
    if (opts.isDefault) this._defaultCommandName = cmd._name;
    if (opts.noHelp || opts.hidden) cmd._hidden = true;
    this._registerCommand(cmd);
    cmd.parent = this;
    cmd._checkForBrokenPassThrough();
    return this;
  }
  /**
   * Factory routine to create a new unattached argument.
   *
   * See .argument() for creating an attached argument, which uses this routine to
   * create the argument. You can override createArgument to return a custom argument.
   *
   * @param {string} name
   * @param {string} [description]
   * @return {Argument} new argument
   */
  createArgument(name, description) {
    return new Argument(name, description);
  }
  /**
   * Define argument syntax for command.
   *
   * The default is that the argument is required, and you can explicitly
   * indicate this with <> around the name. Put [] around the name for an optional argument.
   *
   * @example
   * program.argument('<input-file>');
   * program.argument('[output-file]');
   *
   * @param {string} name
   * @param {string} [description]
   * @param {(Function|*)} [parseArg] - custom argument processing function or default value
   * @param {*} [defaultValue]
   * @return {Command} `this` command for chaining
   */
  argument(name, description, parseArg, defaultValue) {
    const argument = this.createArgument(name, description);
    if (typeof parseArg === "function") {
      argument.default(defaultValue).argParser(parseArg);
    } else {
      argument.default(parseArg);
    }
    this.addArgument(argument);
    return this;
  }
  /**
   * Define argument syntax for command, adding multiple at once (without descriptions).
   *
   * See also .argument().
   *
   * @example
   * program.arguments('<cmd> [env]');
   *
   * @param {string} names
   * @return {Command} `this` command for chaining
   */
  arguments(names) {
    names.trim().split(/ +/).forEach((detail) => {
      this.argument(detail);
    });
    return this;
  }
  /**
   * Define argument syntax for command, adding a prepared argument.
   *
   * @param {Argument} argument
   * @return {Command} `this` command for chaining
   */
  addArgument(argument) {
    const previousArgument = this.registeredArguments.slice(-1)[0];
    if (previousArgument?.variadic) {
      throw new Error(
        `only the last argument can be variadic '${previousArgument.name()}'`
      );
    }
    if (argument.required && argument.defaultValue !== void 0 && argument.parseArg === void 0) {
      throw new Error(
        `a default value for a required argument is never used: '${argument.name()}'`
      );
    }
    this.registeredArguments.push(argument);
    return this;
  }
  /**
   * Customise or override default help command. By default a help command is automatically added if your command has subcommands.
   *
   * @example
   *    program.helpCommand('help [cmd]');
   *    program.helpCommand('help [cmd]', 'show help');
   *    program.helpCommand(false); // suppress default help command
   *    program.helpCommand(true); // add help command even if no subcommands
   *
   * @param {string|boolean} enableOrNameAndArgs - enable with custom name and/or arguments, or boolean to override whether added
   * @param {string} [description] - custom description
   * @return {Command} `this` command for chaining
   */
  helpCommand(enableOrNameAndArgs, description) {
    if (typeof enableOrNameAndArgs === "boolean") {
      this._addImplicitHelpCommand = enableOrNameAndArgs;
      if (enableOrNameAndArgs && this._defaultCommandGroup) {
        this._initCommandGroup(this._getHelpCommand());
      }
      return this;
    }
    const nameAndArgs = enableOrNameAndArgs ?? "help [command]";
    const [, helpName, helpArgs] = nameAndArgs.match(/([^ ]+) *(.*)/);
    const helpDescription = description ?? "display help for command";
    const helpCommand = this.createCommand(helpName);
    helpCommand.helpOption(false);
    if (helpArgs) helpCommand.arguments(helpArgs);
    if (helpDescription) helpCommand.description(helpDescription);
    this._addImplicitHelpCommand = true;
    this._helpCommand = helpCommand;
    if (enableOrNameAndArgs || description) this._initCommandGroup(helpCommand);
    return this;
  }
  /**
   * Add prepared custom help command.
   *
   * @param {(Command|string|boolean)} helpCommand - custom help command, or deprecated enableOrNameAndArgs as for `.helpCommand()`
   * @param {string} [deprecatedDescription] - deprecated custom description used with custom name only
   * @return {Command} `this` command for chaining
   */
  addHelpCommand(helpCommand, deprecatedDescription) {
    if (typeof helpCommand !== "object") {
      this.helpCommand(helpCommand, deprecatedDescription);
      return this;
    }
    this._addImplicitHelpCommand = true;
    this._helpCommand = helpCommand;
    this._initCommandGroup(helpCommand);
    return this;
  }
  /**
   * Lazy create help command.
   *
   * @return {(Command|null)}
   * @package
   */
  _getHelpCommand() {
    const hasImplicitHelpCommand = this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand("help"));
    if (hasImplicitHelpCommand) {
      if (this._helpCommand === void 0) {
        this.helpCommand(void 0, void 0);
      }
      return this._helpCommand;
    }
    return null;
  }
  /**
   * Add hook for life cycle event.
   *
   * @param {string} event
   * @param {Function} listener
   * @return {Command} `this` command for chaining
   */
  hook(event, listener) {
    const allowedValues = ["preSubcommand", "preAction", "postAction"];
    if (!allowedValues.includes(event)) {
      throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
    }
    if (this._lifeCycleHooks[event]) {
      this._lifeCycleHooks[event].push(listener);
    } else {
      this._lifeCycleHooks[event] = [listener];
    }
    return this;
  }
  /**
   * Register callback to use as replacement for calling process.exit.
   *
   * @param {Function} [fn] optional callback which will be passed a CommanderError, defaults to throwing
   * @return {Command} `this` command for chaining
   */
  exitOverride(fn) {
    if (fn) {
      this._exitCallback = fn;
    } else {
      this._exitCallback = (err) => {
        if (err.code !== "commander.executeSubCommandAsync") {
          throw err;
        } else {
        }
      };
    }
    return this;
  }
  /**
   * Call process.exit, and _exitCallback if defined.
   *
   * @param {number} exitCode exit code for using with process.exit
   * @param {string} code an id string representing the error
   * @param {string} message human-readable description of the error
   * @return never
   * @private
   */
  _exit(exitCode, code, message) {
    if (this._exitCallback) {
      this._exitCallback(new CommanderError(exitCode, code, message));
    }
    import_node_process.default.exit(exitCode);
  }
  /**
   * Register callback `fn` for the command.
   *
   * @example
   * program
   *   .command('serve')
   *   .description('start service')
   *   .action(function() {
   *      // do work here
   *   });
   *
   * @param {Function} fn
   * @return {Command} `this` command for chaining
   */
  action(fn) {
    const listener = (args) => {
      const expectedArgsCount = this.registeredArguments.length;
      const actionArgs = args.slice(0, expectedArgsCount);
      if (this._storeOptionsAsProperties) {
        actionArgs[expectedArgsCount] = this;
      } else {
        actionArgs[expectedArgsCount] = this.opts();
      }
      actionArgs.push(this);
      return fn.apply(this, actionArgs);
    };
    this._actionHandler = listener;
    return this;
  }
  /**
   * Factory routine to create a new unattached option.
   *
   * See .option() for creating an attached option, which uses this routine to
   * create the option. You can override createOption to return a custom option.
   *
   * @param {string} flags
   * @param {string} [description]
   * @return {Option} new option
   */
  createOption(flags, description) {
    return new Option(flags, description);
  }
  /**
   * Wrap parseArgs to catch 'commander.invalidArgument'.
   *
   * @param {(Option | Argument)} target
   * @param {string} value
   * @param {*} previous
   * @param {string} invalidArgumentMessage
   * @private
   */
  _callParseArg(target, value, previous, invalidArgumentMessage) {
    try {
      return target.parseArg(value, previous);
    } catch (err) {
      if (err.code === "commander.invalidArgument") {
        const message = `${invalidArgumentMessage} ${err.message}`;
        this.error(message, { exitCode: err.exitCode, code: err.code });
      }
      throw err;
    }
  }
  /**
   * Check for option flag conflicts.
   * Register option if no conflicts found, or throw on conflict.
   *
   * @param {Option} option
   * @private
   */
  _registerOption(option) {
    const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
    if (matchingOption) {
      const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
      throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
    }
    this._initOptionGroup(option);
    this.options.push(option);
  }
  /**
   * Check for command name and alias conflicts with existing commands.
   * Register command if no conflicts found, or throw on conflict.
   *
   * @param {Command} command
   * @private
   */
  _registerCommand(command) {
    const knownBy = (cmd) => {
      return [cmd.name()].concat(cmd.aliases());
    };
    const alreadyUsed = knownBy(command).find(
      (name) => this._findCommand(name)
    );
    if (alreadyUsed) {
      const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
      const newCmd = knownBy(command).join("|");
      throw new Error(
        `cannot add command '${newCmd}' as already have command '${existingCmd}'`
      );
    }
    this._initCommandGroup(command);
    this.commands.push(command);
  }
  /**
   * Add an option.
   *
   * @param {Option} option
   * @return {Command} `this` command for chaining
   */
  addOption(option) {
    this._registerOption(option);
    const oname = option.name();
    const name = option.attributeName();
    if (option.defaultValue !== void 0) {
      this.setOptionValueWithSource(name, option.defaultValue, "default");
    }
    const handleOptionValue = (val, invalidValueMessage, valueSource) => {
      if (val == null && option.presetArg !== void 0) {
        val = option.presetArg;
      }
      const oldValue = this.getOptionValue(name);
      if (val !== null && option.parseArg) {
        val = this._callParseArg(option, val, oldValue, invalidValueMessage);
      } else if (val !== null && option.variadic) {
        val = option._collectValue(val, oldValue);
      }
      if (val == null) {
        if (option.negate) {
          val = false;
        } else if (option.isBoolean() || option.optional) {
          val = true;
        } else {
          val = "";
        }
      }
      this.setOptionValueWithSource(name, val, valueSource);
    };
    this.on("option:" + oname, (val) => {
      const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
      handleOptionValue(val, invalidValueMessage, "cli");
    });
    if (option.envVar) {
      this.on("optionEnv:" + oname, (val) => {
        const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
        handleOptionValue(val, invalidValueMessage, "env");
      });
    }
    return this;
  }
  /**
   * Internal implementation shared by .option() and .requiredOption()
   *
   * @return {Command} `this` command for chaining
   * @private
   */
  _optionEx(config, flags, description, fn, defaultValue) {
    if (typeof flags === "object" && flags instanceof Option) {
      throw new Error(
        "To add an Option object use addOption() instead of option() or requiredOption()"
      );
    }
    const option = this.createOption(flags, description);
    option.makeOptionMandatory(!!config.mandatory);
    if (typeof fn === "function") {
      option.default(defaultValue).argParser(fn);
    } else if (fn instanceof RegExp) {
      const regex = fn;
      fn = (val, def) => {
        const m = regex.exec(val);
        return m ? m[0] : def;
      };
      option.default(defaultValue).argParser(fn);
    } else {
      option.default(fn);
    }
    return this.addOption(option);
  }
  /**
   * Define option with `flags`, `description`, and optional argument parsing function or `defaultValue` or both.
   *
   * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space. A required
   * option-argument is indicated by `<>` and an optional option-argument by `[]`.
   *
   * See the README for more details, and see also addOption() and requiredOption().
   *
   * @example
   * program
   *     .option('-p, --pepper', 'add pepper')
   *     .option('--pt, --pizza-type <TYPE>', 'type of pizza') // required option-argument
   *     .option('-c, --cheese [CHEESE]', 'add extra cheese', 'mozzarella') // optional option-argument with default
   *     .option('-t, --tip <VALUE>', 'add tip to purchase cost', parseFloat) // custom parse function
   *
   * @param {string} flags
   * @param {string} [description]
   * @param {(Function|*)} [parseArg] - custom option processing function or default value
   * @param {*} [defaultValue]
   * @return {Command} `this` command for chaining
   */
  option(flags, description, parseArg, defaultValue) {
    return this._optionEx({}, flags, description, parseArg, defaultValue);
  }
  /**
   * Add a required option which must have a value after parsing. This usually means
   * the option must be specified on the command line. (Otherwise the same as .option().)
   *
   * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space.
   *
   * @param {string} flags
   * @param {string} [description]
   * @param {(Function|*)} [parseArg] - custom option processing function or default value
   * @param {*} [defaultValue]
   * @return {Command} `this` command for chaining
   */
  requiredOption(flags, description, parseArg, defaultValue) {
    return this._optionEx(
      { mandatory: true },
      flags,
      description,
      parseArg,
      defaultValue
    );
  }
  /**
   * Alter parsing of short flags with optional values.
   *
   * @example
   * // for `.option('-f,--flag [value]'):
   * program.combineFlagAndOptionalValue(true);  // `-f80` is treated like `--flag=80`, this is the default behaviour
   * program.combineFlagAndOptionalValue(false) // `-fb` is treated like `-f -b`
   *
   * @param {boolean} [combine] - if `true` or omitted, an optional value can be specified directly after the flag.
   * @return {Command} `this` command for chaining
   */
  combineFlagAndOptionalValue(combine = true) {
    this._combineFlagAndOptionalValue = !!combine;
    return this;
  }
  /**
   * Allow unknown options on the command line.
   *
   * @param {boolean} [allowUnknown] - if `true` or omitted, no error will be thrown for unknown options.
   * @return {Command} `this` command for chaining
   */
  allowUnknownOption(allowUnknown = true) {
    this._allowUnknownOption = !!allowUnknown;
    return this;
  }
  /**
   * Allow excess command-arguments on the command line. Pass false to make excess arguments an error.
   *
   * @param {boolean} [allowExcess] - if `true` or omitted, no error will be thrown for excess arguments.
   * @return {Command} `this` command for chaining
   */
  allowExcessArguments(allowExcess = true) {
    this._allowExcessArguments = !!allowExcess;
    return this;
  }
  /**
   * Enable positional options. Positional means global options are specified before subcommands which lets
   * subcommands reuse the same option names, and also enables subcommands to turn on passThroughOptions.
   * The default behaviour is non-positional and global options may appear anywhere on the command line.
   *
   * @param {boolean} [positional]
   * @return {Command} `this` command for chaining
   */
  enablePositionalOptions(positional = true) {
    this._enablePositionalOptions = !!positional;
    return this;
  }
  /**
   * Pass through options that come after command-arguments rather than treat them as command-options,
   * so actual command-options come before command-arguments. Turning this on for a subcommand requires
   * positional options to have been enabled on the program (parent commands).
   * The default behaviour is non-positional and options may appear before or after command-arguments.
   *
   * @param {boolean} [passThrough] for unknown options.
   * @return {Command} `this` command for chaining
   */
  passThroughOptions(passThrough = true) {
    this._passThroughOptions = !!passThrough;
    this._checkForBrokenPassThrough();
    return this;
  }
  /**
   * @private
   */
  _checkForBrokenPassThrough() {
    if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
      throw new Error(
        `passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`
      );
    }
  }
  /**
   * Whether to store option values as properties on command object,
   * or store separately (specify false). In both cases the option values can be accessed using .opts().
   *
   * @param {boolean} [storeAsProperties=true]
   * @return {Command} `this` command for chaining
   */
  storeOptionsAsProperties(storeAsProperties = true) {
    if (this.options.length) {
      throw new Error("call .storeOptionsAsProperties() before adding options");
    }
    if (Object.keys(this._optionValues).length) {
      throw new Error(
        "call .storeOptionsAsProperties() before setting option values"
      );
    }
    this._storeOptionsAsProperties = !!storeAsProperties;
    return this;
  }
  /**
   * Retrieve option value.
   *
   * @param {string} key
   * @return {object} value
   */
  getOptionValue(key) {
    if (this._storeOptionsAsProperties) {
      return this[key];
    }
    return this._optionValues[key];
  }
  /**
   * Store option value.
   *
   * @param {string} key
   * @param {object} value
   * @return {Command} `this` command for chaining
   */
  setOptionValue(key, value) {
    return this.setOptionValueWithSource(key, value, void 0);
  }
  /**
   * Store option value and where the value came from.
   *
   * @param {string} key
   * @param {object} value
   * @param {string} source - expected values are default/config/env/cli/implied
   * @return {Command} `this` command for chaining
   */
  setOptionValueWithSource(key, value, source) {
    if (this._storeOptionsAsProperties) {
      this[key] = value;
    } else {
      this._optionValues[key] = value;
    }
    this._optionValueSources[key] = source;
    return this;
  }
  /**
   * Get source of option value.
   * Expected values are default | config | env | cli | implied
   *
   * @param {string} key
   * @return {string}
   */
  getOptionValueSource(key) {
    return this._optionValueSources[key];
  }
  /**
   * Get source of option value. See also .optsWithGlobals().
   * Expected values are default | config | env | cli | implied
   *
   * @param {string} key
   * @return {string}
   */
  getOptionValueSourceWithGlobals(key) {
    let source;
    this._getCommandAndAncestors().forEach((cmd) => {
      if (cmd.getOptionValueSource(key) !== void 0) {
        source = cmd.getOptionValueSource(key);
      }
    });
    return source;
  }
  /**
   * Get user arguments from implied or explicit arguments.
   * Side-effects: set _scriptPath if args included script. Used for default program name, and subcommand searches.
   *
   * @private
   */
  _prepareUserArgs(argv, parseOptions) {
    if (argv !== void 0 && !Array.isArray(argv)) {
      throw new Error("first parameter to parse must be array or undefined");
    }
    parseOptions = parseOptions || {};
    if (argv === void 0 && parseOptions.from === void 0) {
      if (import_node_process.default.versions?.electron) {
        parseOptions.from = "electron";
      }
      const execArgv = import_node_process.default.execArgv ?? [];
      if (execArgv.includes("-e") || execArgv.includes("--eval") || execArgv.includes("-p") || execArgv.includes("--print")) {
        parseOptions.from = "eval";
      }
    }
    if (argv === void 0) {
      argv = import_node_process.default.argv;
    }
    this.rawArgs = argv.slice();
    let userArgs;
    switch (parseOptions.from) {
      case void 0:
      case "node":
        this._scriptPath = argv[1];
        userArgs = argv.slice(2);
        break;
      case "electron":
        if (import_node_process.default.defaultApp) {
          this._scriptPath = argv[1];
          userArgs = argv.slice(2);
        } else {
          userArgs = argv.slice(1);
        }
        break;
      case "user":
        userArgs = argv.slice(0);
        break;
      case "eval":
        userArgs = argv.slice(1);
        break;
      default:
        throw new Error(
          `unexpected parse option { from: '${parseOptions.from}' }`
        );
    }
    if (!this._name && this._scriptPath)
      this.nameFromFilename(this._scriptPath);
    this._name = this._name || "program";
    return userArgs;
  }
  /**
   * Parse `argv`, setting options and invoking commands when defined.
   *
   * Use parseAsync instead of parse if any of your action handlers are async.
   *
   * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
   *
   * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
   * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
   * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
   * - `'user'`: just user arguments
   *
   * @example
   * program.parse(); // parse process.argv and auto-detect electron and special node flags
   * program.parse(process.argv); // assume argv[0] is app and argv[1] is script
   * program.parse(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
   *
   * @param {string[]} [argv] - optional, defaults to process.argv
   * @param {object} [parseOptions] - optionally specify style of options with from: node/user/electron
   * @param {string} [parseOptions.from] - where the args are from: 'node', 'user', 'electron'
   * @return {Command} `this` command for chaining
   */
  parse(argv, parseOptions) {
    this._prepareForParse();
    const userArgs = this._prepareUserArgs(argv, parseOptions);
    this._parseCommand([], userArgs);
    return this;
  }
  /**
   * Parse `argv`, setting options and invoking commands when defined.
   *
   * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
   *
   * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
   * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
   * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
   * - `'user'`: just user arguments
   *
   * @example
   * await program.parseAsync(); // parse process.argv and auto-detect electron and special node flags
   * await program.parseAsync(process.argv); // assume argv[0] is app and argv[1] is script
   * await program.parseAsync(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
   *
   * @param {string[]} [argv]
   * @param {object} [parseOptions]
   * @param {string} parseOptions.from - where the args are from: 'node', 'user', 'electron'
   * @return {Promise}
   */
  async parseAsync(argv, parseOptions) {
    this._prepareForParse();
    const userArgs = this._prepareUserArgs(argv, parseOptions);
    await this._parseCommand([], userArgs);
    return this;
  }
  _prepareForParse() {
    if (this._savedState === null) {
      this.options.filter(
        (option) => option.negate && option.defaultValue === void 0 && this.getOptionValue(option.attributeName()) === void 0
      ).forEach((option) => {
        const positiveLongFlag = option.long.replace(/^--no-/, "--");
        if (!this._findOption(positiveLongFlag)) {
          this.setOptionValueWithSource(
            option.attributeName(),
            true,
            "default"
          );
        }
      });
      this.saveStateBeforeParse();
    } else {
      this.restoreStateBeforeParse();
    }
  }
  /**
   * Called the first time parse is called to save state and allow a restore before subsequent calls to parse.
   * Not usually called directly, but available for subclasses to save their custom state.
   *
   * This is called in a lazy way. Only commands used in parsing chain will have state saved.
   */
  saveStateBeforeParse() {
    this._savedState = {
      // name is stable if supplied by author, but may be unspecified for root command and deduced during parsing
      _name: this._name,
      // option values before parse have default values (including false for negated options)
      // shallow clones
      _optionValues: { ...this._optionValues },
      _optionValueSources: { ...this._optionValueSources }
    };
  }
  /**
   * Restore state before parse for calls after the first.
   * Not usually called directly, but available for subclasses to save their custom state.
   *
   * This is called in a lazy way. Only commands used in parsing chain will have state restored.
   */
  restoreStateBeforeParse() {
    if (this._storeOptionsAsProperties)
      throw new Error(`Can not call parse again when storeOptionsAsProperties is true.
- either make a new Command for each call to parse, or stop storing options as properties`);
    this._name = this._savedState._name;
    this._scriptPath = null;
    this.rawArgs = [];
    this._optionValues = { ...this._savedState._optionValues };
    this._optionValueSources = { ...this._savedState._optionValueSources };
    this.args = [];
    this.processedArgs = [];
  }
  /**
   * Throw if expected executable is missing. Add lots of help for author.
   *
   * @param {string} executableFile
   * @param {string} executableDir
   * @param {string} subcommandName
   */
  _checkForMissingExecutable(executableFile, executableDir, subcommandName) {
    if (import_node_fs.default.existsSync(executableFile)) return;
    const executableDirMessage = executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : "no directory for search for local subcommand, use .executableDir() to supply a custom directory";
    const executableMissing = `'${executableFile}' does not exist
 - if '${subcommandName}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
    throw new Error(executableMissing);
  }
  /**
   * Execute a sub-command executable.
   *
   * @private
   */
  _executeSubCommand(subcommand, args) {
    args = args.slice();
    const sourceExt = [".js", ".ts", ".tsx", ".mjs", ".cjs"];
    function findFile(baseDir, baseName) {
      const localBin = import_node_path.default.resolve(baseDir, baseName);
      if (import_node_fs.default.existsSync(localBin)) return localBin;
      if (sourceExt.includes(import_node_path.default.extname(baseName))) return void 0;
      const foundExt = sourceExt.find(
        (ext) => import_node_fs.default.existsSync(`${localBin}${ext}`)
      );
      if (foundExt) return `${localBin}${foundExt}`;
      return void 0;
    }
    this._checkForMissingMandatoryOptions();
    this._checkForConflictingOptions();
    let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
    let executableDir = this._executableDir || "";
    if (this._scriptPath) {
      let resolvedScriptPath;
      try {
        resolvedScriptPath = import_node_fs.default.realpathSync(this._scriptPath);
      } catch {
        resolvedScriptPath = this._scriptPath;
      }
      executableDir = import_node_path.default.resolve(
        import_node_path.default.dirname(resolvedScriptPath),
        executableDir
      );
    }
    if (executableDir) {
      let localFile = findFile(executableDir, executableFile);
      if (!localFile && !subcommand._executableFile && this._scriptPath) {
        const legacyName = import_node_path.default.basename(
          this._scriptPath,
          import_node_path.default.extname(this._scriptPath)
        );
        if (legacyName !== this._name) {
          localFile = findFile(
            executableDir,
            `${legacyName}-${subcommand._name}`
          );
        }
      }
      executableFile = localFile || executableFile;
    }
    const launchWithNode = sourceExt.includes(import_node_path.default.extname(executableFile));
    let proc;
    if (import_node_process.default.platform !== "win32") {
      if (launchWithNode) {
        args.unshift(executableFile);
        args = incrementNodeInspectorPort(import_node_process.default.execArgv).concat(args);
        proc = import_node_child_process.default.spawn(import_node_process.default.argv[0], args, { stdio: "inherit" });
      } else {
        proc = import_node_child_process.default.spawn(executableFile, args, { stdio: "inherit" });
      }
    } else {
      this._checkForMissingExecutable(
        executableFile,
        executableDir,
        subcommand._name
      );
      args.unshift(executableFile);
      args = incrementNodeInspectorPort(import_node_process.default.execArgv).concat(args);
      proc = import_node_child_process.default.spawn(import_node_process.default.execPath, args, { stdio: "inherit" });
    }
    if (!proc.killed) {
      const signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
      signals.forEach((signal) => {
        import_node_process.default.on(signal, () => {
          if (proc.killed === false && proc.exitCode === null) {
            proc.kill(signal);
          }
        });
      });
    }
    const exitCallback = this._exitCallback;
    proc.on("close", (code) => {
      code = code ?? 1;
      if (!exitCallback) {
        import_node_process.default.exit(code);
      } else {
        exitCallback(
          new CommanderError(
            code,
            "commander.executeSubCommandAsync",
            "(close)"
          )
        );
      }
    });
    proc.on("error", (err) => {
      if (err.code === "ENOENT") {
        this._checkForMissingExecutable(
          executableFile,
          executableDir,
          subcommand._name
        );
      } else if (err.code === "EACCES") {
        throw new Error(`'${executableFile}' not executable`);
      }
      if (!exitCallback) {
        import_node_process.default.exit(1);
      } else {
        const wrappedError = new CommanderError(
          1,
          "commander.executeSubCommandAsync",
          "(error)"
        );
        wrappedError.nestedError = err;
        exitCallback(wrappedError);
      }
    });
    this.runningCommand = proc;
  }
  /**
   * @private
   */
  _dispatchSubcommand(commandName, operands, unknown) {
    const subCommand = this._findCommand(commandName);
    if (!subCommand) this.help({ error: true });
    subCommand._prepareForParse();
    let promiseChain;
    promiseChain = this._chainOrCallSubCommandHook(
      promiseChain,
      subCommand,
      "preSubcommand"
    );
    promiseChain = this._chainOrCall(promiseChain, () => {
      if (subCommand._executableHandler) {
        this._executeSubCommand(subCommand, operands.concat(unknown));
      } else {
        return subCommand._parseCommand(operands, unknown);
      }
    });
    return promiseChain;
  }
  /**
   * Invoke help directly if possible, or dispatch if necessary.
   * e.g. help foo
   *
   * @private
   */
  _dispatchHelpCommand(subcommandName) {
    if (!subcommandName) {
      this.help();
    }
    const subCommand = this._findCommand(subcommandName);
    if (subCommand && !subCommand._executableHandler) {
      subCommand.help();
    }
    return this._dispatchSubcommand(
      subcommandName,
      [],
      [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? "--help"]
    );
  }
  /**
   * Check this.args against expected this.registeredArguments.
   *
   * @private
   */
  _checkNumberOfArguments() {
    this.registeredArguments.forEach((arg, i) => {
      if (arg.required && this.args[i] == null) {
        this.missingArgument(arg.name());
      }
    });
    if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) {
      return;
    }
    if (this.args.length > this.registeredArguments.length) {
      this._excessArguments(this.args);
    }
  }
  /**
   * Process this.args using this.registeredArguments and save as this.processedArgs!
   *
   * @private
   */
  _processArguments() {
    const myParseArg = (argument, value, previous) => {
      let parsedValue = value;
      if (value !== null && argument.parseArg) {
        const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
        parsedValue = this._callParseArg(
          argument,
          value,
          previous,
          invalidValueMessage
        );
      }
      return parsedValue;
    };
    this._checkNumberOfArguments();
    const processedArgs = [];
    this.registeredArguments.forEach((declaredArg, index) => {
      let value = declaredArg.defaultValue;
      if (declaredArg.variadic) {
        if (index < this.args.length) {
          value = this.args.slice(index);
          if (declaredArg.parseArg) {
            value = value.reduce((processed, v) => {
              return myParseArg(declaredArg, v, processed);
            }, declaredArg.defaultValue);
          }
        } else if (value === void 0) {
          value = [];
        }
      } else if (index < this.args.length) {
        value = this.args[index];
        if (declaredArg.parseArg) {
          value = myParseArg(declaredArg, value, declaredArg.defaultValue);
        }
      }
      processedArgs[index] = value;
    });
    this.processedArgs = processedArgs;
  }
  /**
   * Once we have a promise we chain, but call synchronously until then.
   *
   * @param {(Promise|undefined)} promise
   * @param {Function} fn
   * @return {(Promise|undefined)}
   * @private
   */
  _chainOrCall(promise, fn) {
    if (promise?.then && typeof promise.then === "function") {
      return promise.then(() => fn());
    }
    return fn();
  }
  /**
   *
   * @param {(Promise|undefined)} promise
   * @param {string} event
   * @return {(Promise|undefined)}
   * @private
   */
  _chainOrCallHooks(promise, event) {
    let result = promise;
    const hooks = [];
    this._getCommandAndAncestors().reverse().filter((cmd) => cmd._lifeCycleHooks[event] !== void 0).forEach((hookedCommand) => {
      hookedCommand._lifeCycleHooks[event].forEach((callback) => {
        hooks.push({ hookedCommand, callback });
      });
    });
    if (event === "postAction") {
      hooks.reverse();
    }
    hooks.forEach((hookDetail) => {
      result = this._chainOrCall(result, () => {
        return hookDetail.callback(hookDetail.hookedCommand, this);
      });
    });
    return result;
  }
  /**
   *
   * @param {(Promise|undefined)} promise
   * @param {Command} subCommand
   * @param {string} event
   * @return {(Promise|undefined)}
   * @private
   */
  _chainOrCallSubCommandHook(promise, subCommand, event) {
    let result = promise;
    if (this._lifeCycleHooks[event] !== void 0) {
      this._lifeCycleHooks[event].forEach((hook) => {
        result = this._chainOrCall(result, () => {
          return hook(this, subCommand);
        });
      });
    }
    return result;
  }
  /**
   * Process arguments in context of this command.
   * Returns action result, in case it is a promise.
   *
   * @private
   */
  _parseCommand(operands, unknown) {
    const parsed = this.parseOptions(unknown);
    this._parseOptionsEnv();
    this._parseOptionsImplied();
    operands = operands.concat(parsed.operands);
    unknown = parsed.unknown;
    this.args = operands.concat(unknown);
    if (operands && this._findCommand(operands[0])) {
      return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
    }
    if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
      return this._dispatchHelpCommand(operands[1]);
    }
    if (this._defaultCommandName) {
      this._outputHelpIfRequested(unknown);
      return this._dispatchSubcommand(
        this._defaultCommandName,
        operands,
        unknown
      );
    }
    if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
      this.help({ error: true });
    }
    this._outputHelpIfRequested(parsed.unknown);
    this._checkForMissingMandatoryOptions();
    this._checkForConflictingOptions();
    const checkForUnknownOptions = () => {
      if (parsed.unknown.length > 0) {
        this.unknownOption(parsed.unknown[0]);
      }
    };
    const commandEvent = `command:${this.name()}`;
    if (this._actionHandler) {
      checkForUnknownOptions();
      this._processArguments();
      let promiseChain;
      promiseChain = this._chainOrCallHooks(promiseChain, "preAction");
      promiseChain = this._chainOrCall(
        promiseChain,
        () => this._actionHandler(this.processedArgs)
      );
      if (this.parent) {
        promiseChain = this._chainOrCall(promiseChain, () => {
          this.parent.emit(commandEvent, operands, unknown);
        });
      }
      promiseChain = this._chainOrCallHooks(promiseChain, "postAction");
      return promiseChain;
    }
    if (this.parent?.listenerCount(commandEvent)) {
      checkForUnknownOptions();
      this._processArguments();
      this.parent.emit(commandEvent, operands, unknown);
    } else if (operands.length) {
      if (this._findCommand("*")) {
        return this._dispatchSubcommand("*", operands, unknown);
      }
      if (this.listenerCount("command:*")) {
        this.emit("command:*", operands, unknown);
      } else if (this.commands.length) {
        this.unknownCommand();
      } else {
        checkForUnknownOptions();
        this._processArguments();
      }
    } else if (this.commands.length) {
      checkForUnknownOptions();
      this.help({ error: true });
    } else {
      checkForUnknownOptions();
      this._processArguments();
    }
  }
  /**
   * Find matching command.
   *
   * @private
   * @return {Command | undefined}
   */
  _findCommand(name) {
    if (!name) return void 0;
    return this.commands.find(
      (cmd) => cmd._name === name || cmd._aliases.includes(name)
    );
  }
  /**
   * Return an option matching `arg` if any.
   *
   * @param {string} arg
   * @return {Option}
   * @package
   */
  _findOption(arg) {
    return this.options.find((option) => option.is(arg));
  }
  /**
   * Display an error message if a mandatory option does not have a value.
   * Called after checking for help flags in leaf subcommand.
   *
   * @private
   */
  _checkForMissingMandatoryOptions() {
    this._getCommandAndAncestors().forEach((cmd) => {
      cmd.options.forEach((anOption) => {
        if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === void 0) {
          cmd.missingMandatoryOptionValue(anOption);
        }
      });
    });
  }
  /**
   * Display an error message if conflicting options are used together in this.
   *
   * @private
   */
  _checkForConflictingLocalOptions() {
    const definedNonDefaultOptions = this.options.filter((option) => {
      const optionKey = option.attributeName();
      if (this.getOptionValue(optionKey) === void 0) {
        return false;
      }
      return this.getOptionValueSource(optionKey) !== "default";
    });
    const optionsWithConflicting = definedNonDefaultOptions.filter(
      (option) => option.conflictsWith.length > 0
    );
    optionsWithConflicting.forEach((option) => {
      const conflictingAndDefined = definedNonDefaultOptions.find(
        (defined) => option.conflictsWith.includes(defined.attributeName())
      );
      if (conflictingAndDefined) {
        this._conflictingOption(option, conflictingAndDefined);
      }
    });
  }
  /**
   * Display an error message if conflicting options are used together.
   * Called after checking for help flags in leaf subcommand.
   *
   * @private
   */
  _checkForConflictingOptions() {
    this._getCommandAndAncestors().forEach((cmd) => {
      cmd._checkForConflictingLocalOptions();
    });
  }
  /**
   * Parse options from `argv` removing known options,
   * and return argv split into operands and unknown arguments.
   *
   * Side effects: modifies command by storing options. Does not reset state if called again.
   *
   * Examples:
   *
   *     argv => operands, unknown
   *     --known kkk op => [op], []
   *     op --known kkk => [op], []
   *     sub --unknown uuu op => [sub], [--unknown uuu op]
   *     sub -- --unknown uuu op => [sub --unknown uuu op], []
   *
   * @param {string[]} args
   * @return {{operands: string[], unknown: string[]}}
   */
  parseOptions(args) {
    const operands = [];
    const unknown = [];
    let dest = operands;
    function maybeOption(arg) {
      return arg.length > 1 && arg[0] === "-";
    }
    const negativeNumberArg = (arg) => {
      if (!/^-(\d+|\d*\.\d+)(e[+-]?\d+)?$/.test(arg)) return false;
      return !this._getCommandAndAncestors().some(
        (cmd) => cmd.options.map((opt) => opt.short).some((short) => /^-\d$/.test(short))
      );
    };
    let activeVariadicOption = null;
    let activeGroup = null;
    let i = 0;
    while (i < args.length || activeGroup) {
      const arg = activeGroup ?? args[i++];
      activeGroup = null;
      if (arg === "--") {
        if (dest === unknown) dest.push(arg);
        dest.push(...args.slice(i));
        break;
      }
      if (activeVariadicOption && (!maybeOption(arg) || negativeNumberArg(arg))) {
        this.emit(`option:${activeVariadicOption.name()}`, arg);
        continue;
      }
      activeVariadicOption = null;
      if (maybeOption(arg)) {
        const option = this._findOption(arg);
        if (option) {
          if (option.required) {
            const value = args[i++];
            if (value === void 0) this.optionMissingArgument(option);
            this.emit(`option:${option.name()}`, value);
          } else if (option.optional) {
            let value = null;
            if (i < args.length && (!maybeOption(args[i]) || negativeNumberArg(args[i]))) {
              value = args[i++];
            }
            this.emit(`option:${option.name()}`, value);
          } else {
            this.emit(`option:${option.name()}`);
          }
          activeVariadicOption = option.variadic ? option : null;
          continue;
        }
      }
      if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
        const option = this._findOption(`-${arg[1]}`);
        if (option) {
          if (option.required || option.optional && this._combineFlagAndOptionalValue) {
            this.emit(`option:${option.name()}`, arg.slice(2));
          } else {
            this.emit(`option:${option.name()}`);
            activeGroup = `-${arg.slice(2)}`;
          }
          continue;
        }
      }
      if (/^--[^=]+=/.test(arg)) {
        const index = arg.indexOf("=");
        const option = this._findOption(arg.slice(0, index));
        if (option && (option.required || option.optional)) {
          this.emit(`option:${option.name()}`, arg.slice(index + 1));
          continue;
        }
      }
      if (dest === operands && maybeOption(arg) && !(this.commands.length === 0 && negativeNumberArg(arg))) {
        dest = unknown;
      }
      if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
        if (this._findCommand(arg)) {
          operands.push(arg);
          unknown.push(...args.slice(i));
          break;
        } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
          operands.push(arg, ...args.slice(i));
          break;
        } else if (this._defaultCommandName) {
          unknown.push(arg, ...args.slice(i));
          break;
        }
      }
      if (this._passThroughOptions) {
        dest.push(arg, ...args.slice(i));
        break;
      }
      dest.push(arg);
    }
    return { operands, unknown };
  }
  /**
   * Return an object containing local option values as key-value pairs.
   *
   * @return {object}
   */
  opts() {
    if (this._storeOptionsAsProperties) {
      const result = {};
      const len = this.options.length;
      for (let i = 0; i < len; i++) {
        const key = this.options[i].attributeName();
        result[key] = key === this._versionOptionName ? this._version : this[key];
      }
      return result;
    }
    return this._optionValues;
  }
  /**
   * Return an object containing merged local and global option values as key-value pairs.
   *
   * @return {object}
   */
  optsWithGlobals() {
    return this._getCommandAndAncestors().reduce(
      (combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()),
      {}
    );
  }
  /**
   * Display error message and exit (or call exitOverride).
   *
   * @param {string} message
   * @param {object} [errorOptions]
   * @param {string} [errorOptions.code] - an id string representing the error
   * @param {number} [errorOptions.exitCode] - used with process.exit
   */
  error(message, errorOptions) {
    this._outputConfiguration.outputError(
      `${message}
`,
      this._outputConfiguration.writeErr
    );
    if (typeof this._showHelpAfterError === "string") {
      this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
    } else if (this._showHelpAfterError) {
      this._outputConfiguration.writeErr("\n");
      this.outputHelp({ error: true });
    }
    const config = errorOptions || {};
    const exitCode = config.exitCode || 1;
    const code = config.code || "commander.error";
    this._exit(exitCode, code, message);
  }
  /**
   * Apply any option related environment variables, if option does
   * not have a value from cli or client code.
   *
   * @private
   */
  _parseOptionsEnv() {
    this.options.forEach((option) => {
      if (option.envVar && option.envVar in import_node_process.default.env) {
        const optionKey = option.attributeName();
        if (this.getOptionValue(optionKey) === void 0 || ["default", "config", "env"].includes(
          this.getOptionValueSource(optionKey)
        )) {
          if (option.required || option.optional) {
            this.emit(`optionEnv:${option.name()}`, import_node_process.default.env[option.envVar]);
          } else {
            this.emit(`optionEnv:${option.name()}`);
          }
        }
      }
    });
  }
  /**
   * Apply any implied option values, if option is undefined or default value.
   *
   * @private
   */
  _parseOptionsImplied() {
    const dualHelper = new DualOptions(this.options);
    const hasCustomOptionValue = (optionKey) => {
      return this.getOptionValue(optionKey) !== void 0 && !["default", "implied"].includes(this.getOptionValueSource(optionKey));
    };
    this.options.filter(
      (option) => option.implied !== void 0 && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(
        this.getOptionValue(option.attributeName()),
        option
      )
    ).forEach((option) => {
      Object.keys(option.implied).filter((impliedKey) => !hasCustomOptionValue(impliedKey)).forEach((impliedKey) => {
        this.setOptionValueWithSource(
          impliedKey,
          option.implied[impliedKey],
          "implied"
        );
      });
    });
  }
  /**
   * Argument `name` is missing.
   *
   * @param {string} name
   * @private
   */
  missingArgument(name) {
    const message = `error: missing required argument '${name}'`;
    this.error(message, { code: "commander.missingArgument" });
  }
  /**
   * `Option` is missing an argument.
   *
   * @param {Option} option
   * @private
   */
  optionMissingArgument(option) {
    const message = `error: option '${option.flags}' argument missing`;
    this.error(message, { code: "commander.optionMissingArgument" });
  }
  /**
   * `Option` does not have a value, and is a mandatory option.
   *
   * @param {Option} option
   * @private
   */
  missingMandatoryOptionValue(option) {
    const message = `error: required option '${option.flags}' not specified`;
    this.error(message, { code: "commander.missingMandatoryOptionValue" });
  }
  /**
   * `Option` conflicts with another option.
   *
   * @param {Option} option
   * @param {Option} conflictingOption
   * @private
   */
  _conflictingOption(option, conflictingOption) {
    const findBestOptionFromValue = (option2) => {
      const optionKey = option2.attributeName();
      const optionValue = this.getOptionValue(optionKey);
      const negativeOption = this.options.find(
        (target) => target.negate && optionKey === target.attributeName()
      );
      const positiveOption = this.options.find(
        (target) => !target.negate && optionKey === target.attributeName()
      );
      if (negativeOption && (negativeOption.presetArg === void 0 && optionValue === false || negativeOption.presetArg !== void 0 && optionValue === negativeOption.presetArg)) {
        return negativeOption;
      }
      return positiveOption || option2;
    };
    const getErrorMessage = (option2) => {
      const bestOption = findBestOptionFromValue(option2);
      const optionKey = bestOption.attributeName();
      const source = this.getOptionValueSource(optionKey);
      if (source === "env") {
        return `environment variable '${bestOption.envVar}'`;
      }
      return `option '${bestOption.flags}'`;
    };
    const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
    this.error(message, { code: "commander.conflictingOption" });
  }
  /**
   * Unknown option `flag`.
   *
   * @param {string} flag
   * @private
   */
  unknownOption(flag) {
    if (this._allowUnknownOption) return;
    let suggestion = "";
    if (flag.startsWith("--") && this._showSuggestionAfterError) {
      let candidateFlags = [];
      let command = this;
      do {
        const moreFlags = command.createHelp().visibleOptions(command).filter((option) => option.long).map((option) => option.long);
        candidateFlags = candidateFlags.concat(moreFlags);
        command = command.parent;
      } while (command && !command._enablePositionalOptions);
      suggestion = suggestSimilar(flag, candidateFlags);
    }
    const message = `error: unknown option '${flag}'${suggestion}`;
    this.error(message, { code: "commander.unknownOption" });
  }
  /**
   * Excess arguments, more than expected.
   *
   * @param {string[]} receivedArgs
   * @private
   */
  _excessArguments(receivedArgs) {
    if (this._allowExcessArguments) return;
    const expected = this.registeredArguments.length;
    const s = expected === 1 ? "" : "s";
    const received = receivedArgs.length;
    const forSubcommand = this.parent ? ` for '${this.name()}'` : "";
    const details = receivedArgs.join(", ");
    const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${received}: ${details}.`;
    this.error(message, { code: "commander.excessArguments" });
  }
  /**
   * Unknown command.
   *
   * @private
   */
  unknownCommand() {
    const unknownName = this.args[0];
    let suggestion = "";
    if (this._showSuggestionAfterError) {
      const candidateNames = [];
      this.createHelp().visibleCommands(this).forEach((command) => {
        candidateNames.push(command.name());
        if (command.alias()) candidateNames.push(command.alias());
      });
      suggestion = suggestSimilar(unknownName, candidateNames);
    }
    const message = `error: unknown command '${unknownName}'${suggestion}`;
    this.error(message, { code: "commander.unknownCommand" });
  }
  /**
   * Get or set the program version.
   *
   * This method auto-registers the "-V, --version" option which will print the version number.
   *
   * You can optionally supply the flags and description to override the defaults.
   *
   * @param {string} [str]
   * @param {string} [flags]
   * @param {string} [description]
   * @return {(this | string | undefined)} `this` command for chaining, or version string if no arguments
   */
  version(str2, flags, description) {
    if (str2 === void 0) return this._version;
    this._version = str2;
    flags = flags || "-V, --version";
    description = description || "output the version number";
    const versionOption = this.createOption(flags, description);
    this._versionOptionName = versionOption.attributeName();
    this._registerOption(versionOption);
    this.on("option:" + versionOption.name(), () => {
      this._outputConfiguration.writeOut(`${str2}
`);
      this._exit(0, "commander.version", str2);
    });
    return this;
  }
  /**
   * Set the description.
   *
   * @param {string} [str]
   * @param {object} [argsDescription]
   * @return {(string|Command)}
   */
  description(str2, argsDescription) {
    if (str2 === void 0 && argsDescription === void 0)
      return this._description;
    this._description = str2;
    if (argsDescription) {
      this._argsDescription = argsDescription;
    }
    return this;
  }
  /**
   * Set the summary. Used when listed as subcommand of parent.
   *
   * @param {string} [str]
   * @return {(string|Command)}
   */
  summary(str2) {
    if (str2 === void 0) return this._summary;
    this._summary = str2;
    return this;
  }
  /**
   * Set an alias for the command.
   *
   * You may call more than once to add multiple aliases. Only the first alias is shown in the auto-generated help.
   *
   * @param {string} [alias]
   * @return {(string|Command)}
   */
  alias(alias) {
    if (alias === void 0) return this._aliases[0];
    let command = this;
    if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
      command = this.commands[this.commands.length - 1];
    }
    if (alias === command._name)
      throw new Error("Command alias can't be the same as its name");
    const matchingCommand = this.parent?._findCommand(alias);
    if (matchingCommand) {
      const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
      throw new Error(
        `cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`
      );
    }
    command._aliases.push(alias);
    return this;
  }
  /**
   * Set aliases for the command.
   *
   * Only the first alias is shown in the auto-generated help.
   *
   * @param {string[]} [aliases]
   * @return {(string[]|Command)}
   */
  aliases(aliases) {
    if (aliases === void 0) return this._aliases;
    aliases.forEach((alias) => this.alias(alias));
    return this;
  }
  /**
   * Set / get the command usage `str`.
   *
   * @param {string} [str]
   * @return {(string|Command)}
   */
  usage(str2) {
    if (str2 === void 0) {
      if (this._usage) return this._usage;
      const args = this.registeredArguments.map((arg) => {
        return humanReadableArgName(arg);
      });
      return [].concat(
        this.options.length || this._helpOption !== null ? "[options]" : [],
        this.commands.length ? "[command]" : [],
        this.registeredArguments.length ? args : []
      ).join(" ");
    }
    this._usage = str2;
    return this;
  }
  /**
   * Get or set the name of the command.
   *
   * @param {string} [str]
   * @return {(string|Command)}
   */
  name(str2) {
    if (str2 === void 0) return this._name;
    this._name = str2;
    return this;
  }
  /**
   * Set/get the help group heading for this subcommand in parent command's help.
   *
   * @param {string} [heading]
   * @return {Command | string}
   */
  helpGroup(heading) {
    if (heading === void 0) return this._helpGroupHeading ?? "";
    this._helpGroupHeading = heading;
    return this;
  }
  /**
   * Set/get the default help group heading for subcommands added to this command.
   * (This does not override a group set directly on the subcommand using .helpGroup().)
   *
   * @example
   * program.commandsGroup('Development Commands:);
   * program.command('watch')...
   * program.command('lint')...
   * ...
   *
   * @param {string} [heading]
   * @returns {Command | string}
   */
  commandsGroup(heading) {
    if (heading === void 0) return this._defaultCommandGroup ?? "";
    this._defaultCommandGroup = heading;
    return this;
  }
  /**
   * Set/get the default help group heading for options added to this command.
   * (This does not override a group set directly on the option using .helpGroup().)
   *
   * @example
   * program
   *   .optionsGroup('Development Options:')
   *   .option('-d, --debug', 'output extra debugging')
   *   .option('-p, --profile', 'output profiling information')
   *
   * @param {string} [heading]
   * @returns {Command | string}
   */
  optionsGroup(heading) {
    if (heading === void 0) return this._defaultOptionGroup ?? "";
    this._defaultOptionGroup = heading;
    return this;
  }
  /**
   * @param {Option} option
   * @private
   */
  _initOptionGroup(option) {
    if (this._defaultOptionGroup && !option.helpGroupHeading)
      option.helpGroup(this._defaultOptionGroup);
  }
  /**
   * @param {Command} cmd
   * @private
   */
  _initCommandGroup(cmd) {
    if (this._defaultCommandGroup && !cmd.helpGroup())
      cmd.helpGroup(this._defaultCommandGroup);
  }
  /**
   * Set the name of the command from script filename, such as process.argv[1],
   * or import.meta.filename.
   *
   * (Used internally and public although not documented in README.)
   *
   * @example
   * program.nameFromFilename(import.meta.filename);
   *
   * @param {string} filename
   * @return {Command}
   */
  nameFromFilename(filename) {
    this._name = import_node_path.default.basename(filename, import_node_path.default.extname(filename));
    return this;
  }
  /**
   * Get or set the directory for searching for executable subcommands of this command.
   *
   * @example
   * program.executableDir(import.meta.dirname);
   * // or
   * program.executableDir('subcommands');
   *
   * @param {string} [path]
   * @return {(string|null|Command)}
   */
  executableDir(path2) {
    if (path2 === void 0) return this._executableDir;
    this._executableDir = path2;
    return this;
  }
  /**
   * Return program help documentation.
   *
   * @param {{ error: boolean }} [contextOptions] - pass {error:true} to wrap for stderr instead of stdout
   * @return {string}
   */
  helpInformation(contextOptions) {
    const helper = this.createHelp();
    const context = this._getOutputContext(contextOptions);
    helper.prepareContext({
      error: context.error,
      helpWidth: context.helpWidth,
      outputHasColors: context.hasColors
    });
    const text = helper.formatHelp(this, helper);
    if (context.hasColors) return text;
    return this._outputConfiguration.stripColor(text);
  }
  /**
   * @typedef HelpContext
   * @type {object}
   * @property {boolean} error
   * @property {number} helpWidth
   * @property {boolean} hasColors
   * @property {function} write - includes stripColor if needed
   *
   * @returns {HelpContext}
   * @private
   */
  _getOutputContext(contextOptions) {
    contextOptions = contextOptions || {};
    const error = !!contextOptions.error;
    let baseWrite;
    let hasColors;
    let helpWidth;
    if (error) {
      baseWrite = (str2) => this._outputConfiguration.writeErr(str2);
      hasColors = this._outputConfiguration.getErrHasColors();
      helpWidth = this._outputConfiguration.getErrHelpWidth();
    } else {
      baseWrite = (str2) => this._outputConfiguration.writeOut(str2);
      hasColors = this._outputConfiguration.getOutHasColors();
      helpWidth = this._outputConfiguration.getOutHelpWidth();
    }
    const write = (str2) => {
      if (!hasColors) str2 = this._outputConfiguration.stripColor(str2);
      return baseWrite(str2);
    };
    return { error, write, hasColors, helpWidth };
  }
  /**
   * Output help information for this command.
   *
   * Outputs built-in help, and custom text added using `.addHelpText()`.
   *
   * @param {{ error: boolean } | Function} [contextOptions] - pass {error:true} to write to stderr instead of stdout
   */
  outputHelp(contextOptions) {
    let deprecatedCallback;
    if (typeof contextOptions === "function") {
      deprecatedCallback = contextOptions;
      contextOptions = void 0;
    }
    const outputContext = this._getOutputContext(contextOptions);
    const eventContext = {
      error: outputContext.error,
      write: outputContext.write,
      command: this
    };
    this._getCommandAndAncestors().reverse().forEach((command) => command.emit("beforeAllHelp", eventContext));
    this.emit("beforeHelp", eventContext);
    let helpInformation = this.helpInformation({ error: outputContext.error });
    if (deprecatedCallback) {
      helpInformation = deprecatedCallback(helpInformation);
      if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) {
        throw new Error("outputHelp callback must return a string or a Buffer");
      }
    }
    outputContext.write(helpInformation);
    if (this._getHelpOption()?.long) {
      this.emit(this._getHelpOption().long);
    }
    this.emit("afterHelp", eventContext);
    this._getCommandAndAncestors().forEach(
      (command) => command.emit("afterAllHelp", eventContext)
    );
  }
  /**
   * You can pass in flags and a description to customise the built-in help option.
   * Pass in false to disable the built-in help option.
   *
   * @example
   * program.helpOption('-?, --help' 'show help'); // customise
   * program.helpOption(false); // disable
   *
   * @param {(string | boolean)} flags
   * @param {string} [description]
   * @return {Command} `this` command for chaining
   */
  helpOption(flags, description) {
    if (typeof flags === "boolean") {
      if (flags) {
        if (this._helpOption === null) this._helpOption = void 0;
        if (this._defaultOptionGroup) {
          this._initOptionGroup(this._getHelpOption());
        }
      } else {
        this._helpOption = null;
      }
      return this;
    }
    this._helpOption = this.createOption(
      flags ?? "-h, --help",
      description ?? "display help for command"
    );
    if (flags || description) this._initOptionGroup(this._helpOption);
    return this;
  }
  /**
   * Lazy create help option.
   * Returns null if has been disabled with .helpOption(false).
   *
   * @returns {(Option | null)} the help option
   * @package
   */
  _getHelpOption() {
    if (this._helpOption === void 0) {
      this.helpOption(void 0, void 0);
    }
    return this._helpOption;
  }
  /**
   * Supply your own option to use for the built-in help option.
   * This is an alternative to using helpOption() to customise the flags and description etc.
   *
   * @param {Option} option
   * @return {Command} `this` command for chaining
   */
  addHelpOption(option) {
    this._helpOption = option;
    this._initOptionGroup(option);
    return this;
  }
  /**
   * Output help information and exit.
   *
   * Outputs built-in help, and custom text added using `.addHelpText()`.
   *
   * @param {{ error: boolean }} [contextOptions] - pass {error:true} to write to stderr instead of stdout
   */
  help(contextOptions) {
    this.outputHelp(contextOptions);
    let exitCode = Number(import_node_process.default.exitCode ?? 0);
    if (exitCode === 0 && contextOptions && typeof contextOptions !== "function" && contextOptions.error) {
      exitCode = 1;
    }
    this._exit(exitCode, "commander.help", "(outputHelp)");
  }
  /**
   * // Do a little typing to coordinate emit and listener for the help text events.
   * @typedef HelpTextEventContext
   * @type {object}
   * @property {boolean} error
   * @property {Command} command
   * @property {function} write
   */
  /**
   * Add additional text to be displayed with the built-in help.
   *
   * Position is 'before' or 'after' to affect just this command,
   * and 'beforeAll' or 'afterAll' to affect this command and all its subcommands.
   *
   * @param {string} position - before or after built-in help
   * @param {(string | Function)} text - string to add, or a function returning a string
   * @return {Command} `this` command for chaining
   */
  addHelpText(position, text) {
    const allowedValues = ["beforeAll", "before", "after", "afterAll"];
    if (!allowedValues.includes(position)) {
      throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
    }
    const helpEvent = `${position}Help`;
    this.on(helpEvent, (context) => {
      let helpStr;
      if (typeof text === "function") {
        helpStr = text({ error: context.error, command: context.command });
      } else {
        helpStr = text;
      }
      if (helpStr) {
        context.write(`${helpStr}
`);
      }
    });
    return this;
  }
  /**
   * Output help information if help flags specified
   *
   * @param {Array} args - array of options to search for help flags
   * @private
   */
  _outputHelpIfRequested(args) {
    const helpOption = this._getHelpOption();
    const helpRequested = helpOption && args.find((arg) => helpOption.is(arg));
    if (helpRequested) {
      this.outputHelp();
      this._exit(0, "commander.helpDisplayed", "(outputHelp)");
    }
  }
};
function incrementNodeInspectorPort(args) {
  return args.map((arg) => {
    if (!arg.startsWith("--inspect")) {
      return arg;
    }
    let debugOption;
    let debugHost = "127.0.0.1";
    let debugPort = "9229";
    let match;
    if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
      debugOption = match[1];
    } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
      debugOption = match[1];
      if (/^\d+$/.test(match[3])) {
        debugPort = match[3];
      } else {
        debugHost = match[3];
      }
    } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
      debugOption = match[1];
      debugHost = match[3];
      debugPort = match[4];
    }
    if (debugOption && debugPort !== "0") {
      return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
    }
    return arg;
  });
}
function useColor() {
  if (import_node_process.default.env.NO_COLOR || import_node_process.default.env.FORCE_COLOR === "0" || import_node_process.default.env.FORCE_COLOR === "false")
    return false;
  if (import_node_process.default.env.FORCE_COLOR || import_node_process.default.env.CLICOLOR_FORCE !== void 0)
    return true;
  return void 0;
}

// ../../../node_modules/.pnpm/commander@15.0.0/node_modules/commander/index.js
var program = new Command();

// packages/cli/src/index.ts
init_src();

// packages/cli/src/doctor.ts
function renderDoctor(s) {
  const lines = [];
  const section = (title) => {
    lines.push("", `## ${title}`, "");
  };
  lines.push("# trackrecord doctor \u2014 corpus structure survey");
  lines.push("");
  lines.push("> Includes tool and field names from your setup \u2014 skim before posting.");
  lines.push("");
  lines.push(
    `Files: ${s.files.total} total (${s.files.main} main, ${s.files.agent} agent, ${s.files.stubs} stubs failing the session rule)`
  );
  lines.push(`Claude Code version range: ${s.versionRange[0] ?? "unknown"} \u2013 ${s.versionRange[1] ?? "unknown"}`);
  section("Record types");
  lines.push("| type | count | field names |");
  lines.push("|---|---|---|");
  for (const t of s.recordTypes) {
    lines.push(`| ${t.type} | ${t.count} | ${t.keys.join(", ")} |`);
  }
  section("Edit-tool input shapes");
  lines.push("| tool | input keys | count |");
  lines.push("|---|---|---|");
  for (const e of s.editToolShapes) {
    lines.push(`| ${e.tool} | ${e.shape} | ${e.count} |`);
  }
  section("Version-gated fields");
  lines.push(
    `entrypoint present on ${s.gatedFields.recordsWithEntrypoint} records, absent on ${s.gatedFields.recordsWithoutEntrypoint}`
  );
  lines.push(`entrypoint values: ${JSON.stringify(s.gatedFields.entrypointValues)}`);
  lines.push(`promptSource values: ${JSON.stringify(s.gatedFields.promptSourceValues)}`);
  section("Session linkage");
  lines.push(`sidechain records: ${s.linkage.sidechainRecords}`);
  lines.push(`compaction boundaries: ${s.linkage.compactBoundaries}`);
  lines.push(`sessionIds reused across files: ${s.linkage.reusedSessionIds}`);
  section("Tool calls");
  lines.push("| tool | count |");
  lines.push("|---|---|");
  for (const t of s.toolCounts) {
    lines.push(`| ${t.name} | ${t.count} |`);
  }
  section("Usage object keys");
  lines.push(s.usageKeys.join(", ") || "(none seen)");
  section("Anomalies");
  if (s.warnings.length === 0) {
    lines.push("none \u2014 every line parsed, every type recognized");
  } else {
    lines.push("| kind | detail | count |");
    lines.push("|---|---|---|");
    for (const w of s.warnings) {
      const detail = w.type ?? w.tool ?? w.ext ?? w.file ?? "";
      lines.push(`| ${w.kind} | ${detail} | ${w.count} |`);
    }
  }
  lines.push("");
  lines.push("---");
  lines.push("This report contains structure only \u2014 no code, prompts, or paths.");
  return lines.join("\n");
}

// packages/cli/src/index.ts
init_summary();

// packages/cli/src/retention.ts
var RETENTION_WINDOW_DAYS = 35;
function retentionNotice(metrics) {
  const [first, last] = metrics.source.dateRange;
  if (first === null || last === null) return null;
  const spanDays = (new Date(last).getTime() - new Date(first).getTime()) / 864e5;
  if (spanDays >= RETENTION_WINDOW_DAYS) return null;
  const firstDay = first.slice(0, 10);
  return `Your logs only go back to ${firstDay} \u2014 Claude Code deletes older sessions by default. Add \`cleanupPeriodDays\` to ~/.claude/settings.json to keep your history (this can't recover what's gone).`;
}

// packages/cli/src/index.ts
var DEFAULT_DIR = (0, import_node_path5.join)((0, import_node_os.homedir)(), ".claude", "projects");
function requireDir(dir) {
  if (!(0, import_node_fs4.existsSync)(dir)) {
    process.stderr.write(
      `trackrecord: directory not found: ${dir}
` + (dir === DEFAULT_DIR ? "No Claude Code logs here yet \u2014 has Claude Code run on this machine?\n" : "Check the --dir path.\n")
    );
    process.exit(1);
  }
  return dir;
}
var program2 = new Command();
program2.enablePositionalOptions();
program2.name("trackrecord").description("Your Claude Code track record \u2014 local, honest, free. Zero network calls.").option("--json", "emit the full schema object to stdout").option("--dir <path>", "override the projects directory", DEFAULT_DIR).option(
  "--show-project-names",
  "show real project folder names in byProject (default: stable project-N labels)"
).action(async (opts) => {
  const metrics = await analyze({
    dir: requireDir(opts.dir),
    showProjectNames: opts.showProjectNames === true
  });
  const notice = retentionNotice(metrics);
  if (opts.json) {
    process.stdout.write(`${JSON.stringify(metrics, null, 2)}
`);
    if (notice) process.stderr.write(`${notice}
`);
    return;
  }
  process.stdout.write(`${renderSummary(metrics)}
`);
  for (const warning of suspectWriterWarnings(metrics)) {
    process.stdout.write(`${warning}
`);
  }
  if (notice) process.stdout.write(`
${notice}
`);
});
if (process.env.TRACKRECORD_INTERNAL === "1") {
  program2.command("card").description("render the shareable ship card PNG (internal until launch)").option("--dir <path>", "override the projects directory", DEFAULT_DIR).option("--since <date>", "only count activity since YYYY-MM-DD").option("--range <range>", "only count activity in YYYY-MM-DD..YYYY-MM-DD").option("--out <path>", "output path", "./trackrecord-card.png").action(async (opts) => {
    const { parseDateOptions: parseDateOptions2, renderCardPng: renderCardPng2 } = await Promise.resolve().then(() => (init_card(), card_exports));
    const { writeFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    const metrics = await analyze({ dir: requireDir(opts.dir), ...parseDateOptions2(opts) });
    const png = await renderCardPng2(metrics);
    const out = resolve(opts.out);
    await writeFile(out, png);
    process.stdout.write(`${out}
`);
    const notice = retentionNotice(metrics);
    if (notice) process.stderr.write(`${notice}
`);
  });
}
program2.command("doctor").description("anonymized corpus structure survey \u2014 paste into a GitHub issue").option("--dir <path>", "override the projects directory", DEFAULT_DIR).action(async (opts) => {
  const s = await survey(requireDir(opts.dir));
  process.stdout.write(`${renderDoctor(s)}
`);
});
program2.parseAsync().catch((err) => {
  process.stderr.write(`trackrecord: ${err instanceof Error ? err.message : String(err)}
`);
  process.exitCode = 1;
});
