import { describe, expect, it } from "vitest";
import { formatForAgent, type FileDiagnostics } from "../../src/diagnostics/format";

const file: FileDiagnostics = {
  path: "/repo/src/auth.ts",
  checkedAt: 1,
  errors: 1,
  warnings: 1,
  items: [
    { line: 42, column: 7, severity: "error", code: "TS2322", source: "ts", message: "Type 'string' is not\n assignable to type 'number'." },
    { line: 3, column: 1, severity: "warning", source: "eslint", code: "no-unused-vars", message: "'x' is defined but never used." },
    { line: 9, column: 1, severity: "info", message: "ignored" },
  ],
};

const rel = (p: string) => p.replace("/repo/", "");

describe("formatForAgent", () => {
  it("lists errors and warnings with locations", () => {
    const text = formatForAgent([file], { level: "errorsAndWarnings", displayPath: rel });
    expect(text).toContain("1 error, 1 warning");
    expect(text).toContain("- src/auth.ts:42:7 error TS2322 (ts): Type 'string' is not assignable to type 'number'.");
    expect(text).toContain("src/auth.ts:3:1 warning no-unused-vars (eslint)");
    expect(text).not.toContain("ignored");
  });

  it("can report errors only", () => {
    const text = formatForAgent([file], { level: "errors", displayPath: rel });
    expect(text).toContain("1 error:");
    expect(text).not.toContain("warning");
  });

  it("stays quiet when files are clean or feedback is off", () => {
    expect(formatForAgent([{ ...file, errors: 0, warnings: 0, items: [] }], { level: "errorsAndWarnings" })).toBe("");
    expect(formatForAgent([file], { level: "off" })).toBe("");
  });

  it("caps output size", () => {
    const many = { ...file, errors: 500, items: Array.from({ length: 500 }, (_, i) => ({ line: i, column: 1, severity: "error" as const, message: "x".repeat(200) })) };
    const text = formatForAgent([many], { level: "errors", maxItemsPerFile: 500, maxChars: 2000 });
    expect(text.length).toBeLessThanOrEqual(2100);
    expect(text).toContain("truncated");
  });
});
