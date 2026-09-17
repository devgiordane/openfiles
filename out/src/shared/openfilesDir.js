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
exports.ensureOpenfilesDir = ensureOpenfilesDir;
exports.atomicWrite = atomicWrite;
exports.exists = exists;
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
/** Creates `<root>/.openfiles/` with a `.gitignore` of `*`, so the user's own .gitignore stays untouched. */
async function ensureOpenfilesDir(root) {
    const dir = path.join(root, ".openfiles");
    await fs.mkdir(dir, { recursive: true });
    const gitignore = path.join(dir, ".gitignore");
    try {
        await fs.access(gitignore);
    }
    catch {
        await fs.writeFile(gitignore, "# Local state written by the OpenFiles extension.\n*\n", "utf8");
    }
    return dir;
}
async function atomicWrite(file, content) {
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(tmp, content, "utf8");
    await fs.rename(tmp, file);
}
async function exists(file) {
    try {
        await fs.access(file);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=openfilesDir.js.map