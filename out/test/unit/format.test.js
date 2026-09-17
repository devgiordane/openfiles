"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const format_1 = require("../../src/diagnostics/format");
const file = {
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
const rel = (p) => p.replace("/repo/", "");
(0, vitest_1.describe)("formatForAgent", () => {
    (0, vitest_1.it)("lists errors and warnings with locations", () => {
        const text = (0, format_1.formatForAgent)([file], { level: "errorsAndWarnings", displayPath: rel });
        (0, vitest_1.expect)(text).toContain("1 error, 1 warning");
        (0, vitest_1.expect)(text).toContain("- src/auth.ts:42:7 error TS2322 (ts): Type 'string' is not assignable to type 'number'.");
        (0, vitest_1.expect)(text).toContain("src/auth.ts:3:1 warning no-unused-vars (eslint)");
        (0, vitest_1.expect)(text).not.toContain("ignored");
    });
    (0, vitest_1.it)("can report errors only", () => {
        const text = (0, format_1.formatForAgent)([file], { level: "errors", displayPath: rel });
        (0, vitest_1.expect)(text).toContain("1 error:");
        (0, vitest_1.expect)(text).not.toContain("warning");
    });
    (0, vitest_1.it)("stays quiet when files are clean or feedback is off", () => {
        (0, vitest_1.expect)((0, format_1.formatForAgent)([{ ...file, errors: 0, warnings: 0, items: [] }], { level: "errorsAndWarnings" })).toBe("");
        (0, vitest_1.expect)((0, format_1.formatForAgent)([file], { level: "off" })).toBe("");
    });
    (0, vitest_1.it)("caps output size", () => {
        const many = { ...file, errors: 500, items: Array.from({ length: 500 }, (_, i) => ({ line: i, column: 1, severity: "error", message: "x".repeat(200) })) };
        const text = (0, format_1.formatForAgent)([many], { level: "errors", maxItemsPerFile: 500, maxChars: 2000 });
        (0, vitest_1.expect)(text.length).toBeLessThanOrEqual(2100);
        (0, vitest_1.expect)(text).toContain("truncated");
    });
});
//# sourceMappingURL=format.test.js.map