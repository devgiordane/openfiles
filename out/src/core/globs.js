"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMatcher = createMatcher;
const picomatch_1 = __importDefault(require("picomatch"));
function createMatcher(patterns, platform = process.platform) {
    const cleaned = patterns.filter((pattern) => typeof pattern === "string" && pattern.trim() !== "");
    if (cleaned.length === 0) {
        return () => false;
    }
    const isMatch = (0, picomatch_1.default)(cleaned, { dot: true, nocase: platform === "win32" });
    return (relativePosixPath) => isMatch(relativePosixPath);
}
//# sourceMappingURL=globs.js.map