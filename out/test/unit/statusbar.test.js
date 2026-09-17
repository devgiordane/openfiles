"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const render_1 = require("../../src/statusbar/render");
const busy = { edited: 4, unreviewed: 3, errors: 2, warnings: 1, agent: "Claude Code", paused: false };
(0, vitest_1.describe)("renderStatusText", () => {
    (0, vitest_1.it)("renders the chosen items in order", () => {
        (0, vitest_1.expect)((0, render_1.renderStatusText)(["unreviewed", "errors", "warnings"], busy)).toBe("$(eye) 3  $(error) 2  $(warning) 1");
    });
    (0, vitest_1.it)("shows the agent and pause state only when they apply", () => {
        (0, vitest_1.expect)((0, render_1.renderStatusText)(["agent", "paused"], busy)).toBe("$(hubot) Claude Code");
        (0, vitest_1.expect)((0, render_1.renderStatusText)(["edited", "paused"], { ...busy, paused: true })).toBe("$(files) 4  $(debug-pause)");
    });
    (0, vitest_1.it)("falls back to the name when there is nothing to show", () => {
        (0, vitest_1.expect)((0, render_1.renderStatusText)(["unreviewed"], { ...busy, edited: 0, unreviewed: 0 })).toBe("$(eye) OpenFiles");
        (0, vitest_1.expect)((0, render_1.renderStatusText)([], busy)).toBe("$(eye) OpenFiles");
    });
});
//# sourceMappingURL=statusbar.test.js.map