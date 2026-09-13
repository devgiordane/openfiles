import { describe, expect, it } from "vitest";
import { renderStatusText } from "../../src/statusbar/render";

const busy = { edited: 4, unreviewed: 3, errors: 2, warnings: 1, agent: "Claude Code", paused: false };

describe("renderStatusText", () => {
  it("renders the chosen items in order", () => {
    expect(renderStatusText(["unreviewed", "errors", "warnings"], busy)).toBe("$(eye) 3  $(error) 2  $(warning) 1");
  });

  it("shows the agent and pause state only when they apply", () => {
    expect(renderStatusText(["agent", "paused"], busy)).toBe("$(hubot) Claude Code");
    expect(renderStatusText(["edited", "paused"], { ...busy, paused: true })).toBe("$(files) 4  $(debug-pause)");
  });

  it("falls back to the name when there is nothing to show", () => {
    expect(renderStatusText(["unreviewed"], { ...busy, edited: 0, unreviewed: 0 })).toBe("$(eye) OpenFiles");
    expect(renderStatusText([], busy)).toBe("$(eye) OpenFiles");
  });
});
