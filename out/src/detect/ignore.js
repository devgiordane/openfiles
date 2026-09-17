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
exports.IgnoreRules = void 0;
const path = __importStar(require("node:path"));
const vscode = __importStar(require("vscode"));
const globs_1 = require("../core/globs");
const paths_1 = require("../core/paths");
// Never tracked, whatever the settings say: our own state would otherwise feed back into the watcher.
const HARD_IGNORES = [".git/**", "**/.git/**", ".openfiles/**", "**/.openfiles/**"];
class IgnoreRules {
    ignored = () => false;
    sensitive = () => false;
    constructor(settings) {
        this.rebuild(settings);
    }
    rebuild(settings) {
        const filesExclude = vscode.workspace.getConfiguration("files").get("exclude", {});
        const excluded = Object.entries(filesExclude)
            .filter(([, enabled]) => enabled === true)
            .flatMap(([pattern]) => [pattern, `${pattern}/**`]);
        this.ignored = (0, globs_1.createMatcher)([...HARD_IGNORES, ...settings.ignore, ...excluded]);
        this.sensitive = (0, globs_1.createMatcher)(settings.sensitive);
    }
    /** Workspace-relative posix path, or undefined when outside every workspace folder. */
    relative(uri) {
        const folder = vscode.workspace.getWorkspaceFolder(uri);
        return folder ? (0, paths_1.toPosix)(path.relative(folder.uri.fsPath, uri.fsPath)) : undefined;
    }
    isIgnored(uri) {
        if (uri.scheme !== "file") {
            return true;
        }
        const relative = this.relative(uri);
        return relative === undefined || relative === "" || this.ignored(relative);
    }
    isSensitive(uri) {
        const relative = this.relative(uri);
        return relative !== undefined && this.sensitive(relative);
    }
}
exports.IgnoreRules = IgnoreRules;
//# sourceMappingURL=ignore.js.map