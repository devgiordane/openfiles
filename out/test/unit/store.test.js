"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const store_1 = require("../../src/session/store");
(0, vitest_1.describe)("EditSession", () => {
    (0, vitest_1.it)("records a new file once and counts later edits", () => {
        const session = new store_1.EditSession("linux");
        (0, vitest_1.expect)(session.record({ fsPath: "/repo/a.ts", source: "watcher", at: 1000 }).isNew).toBe(true);
        const second = session.record({ fsPath: "/repo/a.ts", source: "watcher", at: 10_000 });
        (0, vitest_1.expect)(second.isNew).toBe(false);
        (0, vitest_1.expect)(second.entry.changes).toBe(2);
    });
    (0, vitest_1.it)("merges a hook report with the watcher event for the same write", () => {
        const session = new store_1.EditSession("linux");
        session.record({ fsPath: "/repo/a.ts", source: "watcher", at: 1000 });
        const { entry, isNewChange } = session.record({ fsPath: "/repo/a.ts", source: "hook", agent: "claude", tool: "Edit", at: 1200 });
        (0, vitest_1.expect)(isNewChange).toBe(false);
        (0, vitest_1.expect)(entry.changes).toBe(1);
        (0, vitest_1.expect)(entry.source).toBe("hook");
        (0, vitest_1.expect)(entry.agent).toBe("claude");
    });
    (0, vitest_1.it)("does not let a watcher event erase the agent a hook reported", () => {
        const session = new store_1.EditSession("linux");
        session.record({ fsPath: "/repo/a.ts", source: "hook", agent: "codex", at: 1000 });
        const { entry } = session.record({ fsPath: "/repo/a.ts", source: "watcher", at: 9000 });
        (0, vitest_1.expect)(entry.source).toBe("hook");
        (0, vitest_1.expect)(entry.agent).toBe("codex");
    });
    (0, vitest_1.it)("marks a reviewed file unreviewed again when it changes", () => {
        const session = new store_1.EditSession("linux");
        session.record({ fsPath: "/repo/a.ts", source: "hook", at: 1000 });
        session.setReviewed(["/repo/a.ts"], true);
        (0, vitest_1.expect)(session.unreviewed()).toHaveLength(0);
        session.record({ fsPath: "/repo/a.ts", source: "hook", at: 1500 });
        (0, vitest_1.expect)(session.unreviewed()).toHaveLength(1);
    });
    (0, vitest_1.it)("treats Windows paths case-insensitively", () => {
        const session = new store_1.EditSession("win32");
        session.record({ fsPath: "C:\\Repo\\A.ts", source: "watcher", at: 1 });
        (0, vitest_1.expect)(session.has("c:\\repo\\a.ts")).toBe(true);
    });
    (0, vitest_1.it)("round-trips through JSON", () => {
        const session = new store_1.EditSession("linux");
        session.record({ fsPath: "/repo/a.ts", source: "hook", agent: "gemini", at: 5 });
        const copy = new store_1.EditSession("linux");
        copy.restore(JSON.parse(JSON.stringify(session)));
        (0, vitest_1.expect)(copy.get("/repo/a.ts")?.agent).toBe("gemini");
    });
    (0, vitest_1.it)("notifies listeners", () => {
        const session = new store_1.EditSession("linux");
        let calls = 0;
        session.onDidChange(() => (calls += 1));
        session.record({ fsPath: "/repo/a.ts", source: "git" });
        session.markAllReviewed();
        session.clear();
        (0, vitest_1.expect)(calls).toBe(3);
    });
});
//# sourceMappingURL=store.test.js.map