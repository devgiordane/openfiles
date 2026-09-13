import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { parseHookInput, parsePatchPaths } from "../../src/hook/parse";

const cwd = path.resolve("/work/repo");

describe("parseHookInput", () => {
  it("reads Claude Code PostToolUse payloads", () => {
    const event = parseHookInput("claude", {
      cwd,
      tool_name: "Edit",
      tool_input: { file_path: path.join(cwd, "src/app.ts"), old_string: "a", new_string: "b" },
    });
    expect(event.paths).toEqual([path.join(cwd, "src/app.ts")]);
    expect(event.tool).toBe("Edit");
  });

  it("ignores read-only tools", () => {
    const event = parseHookInput("cursor", { tool_name: "Read", tool_input: { file_path: "/x/a.ts" } });
    expect(event.paths).toEqual([]);
  });

  it("extracts every file from a Codex apply_patch", () => {
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
    const event = parseHookInput("codex", { cwd, tool_name: "apply_patch", tool_input: { command: patch } });
    expect(event.paths).toEqual([path.resolve(cwd, "src/a.ts"), path.resolve(cwd, "src/b.ts")]);
  });

  it("parses Copilot CLI toolArgs sent as a JSON string", () => {
    const event = parseHookInput("copilot", { cwd, toolName: "edit", toolArgs: JSON.stringify({ path: "lib/x.py" }) });
    expect(event.paths).toEqual([path.resolve(cwd, "lib/x.py")]);
  });

  it("reads Gemini CLI write_file", () => {
    const event = parseHookInput("gemini", { cwd, tool_name: "write_file", tool_input: { file_path: "README.md", content: "hi" } });
    expect(event.paths).toEqual([path.resolve(cwd, "README.md")]);
  });

  it("reads Cursor afterFileEdit (no tool name)", () => {
    const event = parseHookInput("cursor", { file_path: "/abs/main.go", edits: [] });
    expect(event.paths).toEqual(["/abs/main.go"]);
  });

  it("reads Windsurf post_write_code", () => {
    const event = parseHookInput("windsurf", { tool_info: { file_path: "/abs/app.rb", edits: [] } });
    expect(event.paths).toEqual(["/abs/app.rb"]);
  });

  it("returns nothing for junk input", () => {
    expect(parseHookInput("unknown", "nope").paths).toEqual([]);
    expect(parseHookInput("unknown", null).paths).toEqual([]);
  });
});

describe("parsePatchPaths", () => {
  it("understands unified diffs", () => {
    expect(parsePatchPaths("--- a/x.ts\n+++ b/x.ts\n@@ -1 +1 @@\n--- a/y\n+++ /dev/null")).toEqual(["x.ts"]);
  });

  it("follows renames", () => {
    expect(parsePatchPaths("*** Update File: old.ts\n*** Move to: new.ts")).toEqual(["old.ts", "new.ts"]);
  });
});
