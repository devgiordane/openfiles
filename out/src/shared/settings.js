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
exports.CLICK_ACTIONS = exports.STATUS_ITEMS = void 0;
exports.readSettings = readSettings;
const vscode = __importStar(require("vscode"));
exports.STATUS_ITEMS = ["edited", "unreviewed", "errors", "warnings", "agent", "paused"];
exports.CLICK_ACTIONS = ["menu", "reviewNext", "openAiEdits", "showProblems", "focusSidebar"];
function readSettings() {
    const config = vscode.workspace.getConfiguration("openfiles");
    const get = (key, fallback) => config.get(key, fallback);
    return {
        mode: get("mode", "open"),
        openInBackground: get("openInBackground", true),
        maxAutoOpen: get("maxAutoOpen", 15),
        closeReviewedTabs: get("closeReviewedTabs", false),
        ignore: get("ignore", []),
        sensitive: get("sensitive", []),
        detection: {
            watcher: get("detection.watcher", true),
            git: get("detection.git", true),
            hooks: get("detection.hooks", true),
            burstLimit: get("detection.burstLimit", 200),
            editorSaveGraceMs: get("detection.editorSaveGraceMs", 1500),
        },
        diagnosticsExport: get("diagnostics.export", true),
        hooks: {
            feedback: get("hooks.feedback", "errorsAndWarnings"),
            feedbackTimeoutMs: get("hooks.feedbackTimeoutMs", 4000),
        },
        statusBar: {
            enabled: get("statusBar.enabled", true),
            items: get("statusBar.items", ["unreviewed", "errors", "warnings"]),
            clickAction: get("statusBar.clickAction", "menu"),
            alignment: get("statusBar.alignment", "left"),
        },
        configFile: get("configFile", ".openfiles.json"),
        heartbeatSeconds: get("heartbeatSeconds", 5),
    };
}
//# sourceMappingURL=settings.js.map