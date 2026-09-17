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
exports.pathKey = pathKey;
exports.toPosix = toPosix;
exports.isInside = isInside;
exports.displayPath = displayPath;
const path = __importStar(require("node:path"));
/** Stable map key for a filesystem path (case-insensitive on Windows). */
function pathKey(fsPath, platform = process.platform) {
    const normalized = path.normalize(fsPath);
    return platform === "win32" ? normalized.toLowerCase() : normalized;
}
function toPosix(value) {
    return value.replaceAll("\\", "/");
}
function isInside(root, file) {
    const relative = path.relative(root, file);
    return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}
/** Workspace-relative posix path when inside `root`, otherwise the absolute path. */
function displayPath(fsPath, root) {
    if (root && isInside(root, fsPath)) {
        return toPosix(path.relative(root, fsPath));
    }
    return fsPath;
}
//# sourceMappingURL=paths.js.map