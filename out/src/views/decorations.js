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
exports.AiEditDecorations = void 0;
const vscode = __importStar(require("vscode"));
const labels_1 = require("./labels");
class AiEditDecorations {
    session;
    emitter = new vscode.EventEmitter();
    onDidChangeFileDecorations = this.emitter.event;
    subscription;
    constructor(session) {
        this.session = session;
        this.subscription = session.onDidChange(() => this.emitter.fire(undefined));
    }
    provideFileDecoration(uri) {
        if (uri.scheme !== "file") {
            return undefined;
        }
        const entry = this.session.get(uri.fsPath);
        if (!entry || entry.reviewed) {
            return undefined;
        }
        return {
            badge: "AI",
            tooltip: vscode.l10n.t("Changed by {0}, not reviewed yet", (0, labels_1.agentLabel)(entry)),
            color: new vscode.ThemeColor("openfiles.unreviewedForeground"),
        };
    }
    dispose() {
        this.subscription.dispose();
        this.emitter.dispose();
    }
}
exports.AiEditDecorations = AiEditDecorations;
//# sourceMappingURL=decorations.js.map