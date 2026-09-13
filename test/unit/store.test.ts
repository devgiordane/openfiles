import { describe, expect, it } from "vitest";
import { EditSession } from "../../src/session/store";

describe("EditSession", () => {
  it("records a new file once and counts later edits", () => {
    const session = new EditSession("linux");
    expect(session.record({ fsPath: "/repo/a.ts", source: "watcher", at: 1000 }).isNew).toBe(true);
    const second = session.record({ fsPath: "/repo/a.ts", source: "watcher", at: 10_000 });
    expect(second.isNew).toBe(false);
    expect(second.entry.changes).toBe(2);
  });

  it("merges a hook report with the watcher event for the same write", () => {
    const session = new EditSession("linux");
    session.record({ fsPath: "/repo/a.ts", source: "watcher", at: 1000 });
    const { entry, isNewChange } = session.record({ fsPath: "/repo/a.ts", source: "hook", agent: "claude", tool: "Edit", at: 1200 });
    expect(isNewChange).toBe(false);
    expect(entry.changes).toBe(1);
    expect(entry.source).toBe("hook");
    expect(entry.agent).toBe("claude");
  });

  it("does not let a watcher event erase the agent a hook reported", () => {
    const session = new EditSession("linux");
    session.record({ fsPath: "/repo/a.ts", source: "hook", agent: "codex", at: 1000 });
    const { entry } = session.record({ fsPath: "/repo/a.ts", source: "watcher", at: 9000 });
    expect(entry.source).toBe("hook");
    expect(entry.agent).toBe("codex");
  });

  it("marks a reviewed file unreviewed again when it changes", () => {
    const session = new EditSession("linux");
    session.record({ fsPath: "/repo/a.ts", source: "hook", at: 1000 });
    session.setReviewed(["/repo/a.ts"], true);
    expect(session.unreviewed()).toHaveLength(0);
    session.record({ fsPath: "/repo/a.ts", source: "hook", at: 1500 });
    expect(session.unreviewed()).toHaveLength(1);
  });

  it("treats Windows paths case-insensitively", () => {
    const session = new EditSession("win32");
    session.record({ fsPath: "C:\\Repo\\A.ts", source: "watcher", at: 1 });
    expect(session.has("c:\\repo\\a.ts")).toBe(true);
  });

  it("round-trips through JSON", () => {
    const session = new EditSession("linux");
    session.record({ fsPath: "/repo/a.ts", source: "hook", agent: "gemini", at: 5 });
    const copy = new EditSession("linux");
    copy.restore(JSON.parse(JSON.stringify(session)));
    expect(copy.get("/repo/a.ts")?.agent).toBe("gemini");
  });

  it("notifies listeners", () => {
    const session = new EditSession("linux");
    let calls = 0;
    session.onDidChange(() => (calls += 1));
    session.record({ fsPath: "/repo/a.ts", source: "git" });
    session.markAllReviewed();
    session.clear();
    expect(calls).toBe(3);
  });
});
