"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("node:path"));
const vitest_1 = require("vitest");
const parse_1 = require("../../src/hook/parse");
const cwd = path.resolve("/work/repo");
(0, vitest_1.describe)("parseHookInput", () => {
    (0, vitest_1.it)("reads Claude Code PostToolUse payloads", () => {
        const event = (0, parse_1.parseHookInput)("claude", {
            cwd,
            tool_name: "Edit",
            tool_input: { file_path: path.join(cwd, "src/app.ts"), old_string: "a", new_string: "b" },
        });
        (0, vitest_1.expect)(event.paths).toEqual([path.join(cwd, "src/app.ts")]);
        (0, vitest_1.expect)(event.tool).toBe("Edit");
    });
    (0, vitest_1.it)("ignores read-only tools", () => {
        const event = (0, parse_1.parseHookInput)("cursor", { tool_name: "Read", tool_input: { file_path: "/x/a.ts" } });
        (0, vitest_1.expect)(event.paths).toEqual([]);
    });
    (0, vitest_1.it)("extracts every file from a Codex apply_patch", () => {
        const patch = [
            "*** Begin Patch",
            "*** Update File: src/a.ts",
            "@@",
            "-old",
            "+new",
            "*** Add File: src/b.ts",
            "+export {};",
            "*** Delete File: src/c.ts",
            "*** End Patch",
        ].join("\n");
        const event = (0, parse_1.parseHookInput)("codex", { cwd, tool_name: "apply_patch", tool_input: { command: patch } });
        (0, vitest_1.expect)(event.paths).toEqual([path.resolve(cwd, "src/a.ts"), path.resolve(cwd, "src/b.ts")]);
    });
    (0, vitest_1.it)("parses Copilot CLI toolArgs sent as a JSON string", () => {
        const event = (0, parse_1.parseHookInput)("copilot", { cwd, toolName: "edit", toolArgs: JSON.stringify({ path: "lib/x.py" }) });
        (0, vitest_1.expect)(event.paths).toEqual([path.resolve(cwd, "lib/x.py")]);
    });
    (0, vitest_1.it)("reads Gemini CLI write_file", () => {
        const event = (0, parse_1.parseHookInput)("gemini", { cwd, tool_name: "write_file", tool_input: { file_path: "README.md", content: "hi" } });
        (0, vitest_1.expect)(event.paths).toEqual([path.resolve(cwd, "README.md")]);
    });
    (0, vitest_1.it)("reads Cursor afterFileEdit (no tool name)", () => {
        const event = (0, parse_1.parseHookInput)("cursor", { file_path: "/abs/main.go", edits: [] });
        (0, vitest_1.expect)(event.paths).toEqual(["/abs/main.go"]);
    });
    (0, vitest_1.it)("reads Windsurf post_write_code", () => {
        const event = (0, parse_1.parseHookInput)("windsurf", { tool_info: { file_path: "/abs/app.rb", edits: [] } });
        (0, vitest_1.expect)(event.paths).toEqual(["/abs/app.rb"]);
    });
    (0, vitest_1.it)("returns nothing for junk input", () => {
        (0, vitest_1.expect)((0, parse_1.parseHookInput)("unknown", "nope").paths).toEqual([]);
        (0, vitest_1.expect)((0, parse_1.parseHookInput)("unknown", null).paths).toEqual([]);
    });
});
(0, vitest_1.describe)("parsePatchPaths", () => {
    (0, vitest_1.it)("understands unified diffs", () => {
        (0, vitest_1.expect)((0, parse_1.parsePatchPaths)("--- a/x.ts\n+++ b/x.ts\n@@ -1 +1 @@\n--- a/y\n+++ /dev/null")).toEqual(["x.ts"]);
    });
    (0, vitest_1.it)("follows renames", () => {
        (0, vitest_1.expect)((0, parse_1.parsePatchPaths)("*** Update File: old.ts\n*** Move to: new.ts")).toEqual(["old.ts", "new.ts"]);
    });
});
//# sourceMappingURL=parse.test.js.map