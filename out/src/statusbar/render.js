"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderStatusText = renderStatusText;
function renderStatusText(items, state) {
    const parts = [];
    for (const item of items) {
        switch (item) {
            case "edited":
                parts.push(`$(files) ${state.edited}`);
                break;
            case "unreviewed":
                parts.push(`$(eye) ${state.unreviewed}`);
                break;
            case "errors":
                parts.push(`$(error) ${state.errors}`);
                break;
            case "warnings":
                parts.push(`$(warning) ${state.warnings}`);
                break;
            case "agent":
                if (state.agent) {
                    parts.push(`$(hubot) ${state.agent}`);
                }
                break;
            case "paused":
                if (state.paused) {
                    parts.push("$(debug-pause)");
                }
                break;
        }
    }
    if (state.edited === 0 && !state.paused) {
        return "$(eye) OpenFiles";
    }
    return parts.length > 0 ? parts.join("  ") : "$(eye) OpenFiles";
}
//# sourceMappingURL=render.js.map