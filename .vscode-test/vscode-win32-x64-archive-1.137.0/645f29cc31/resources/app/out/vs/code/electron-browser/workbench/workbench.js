/*!--------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

export function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

export var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    }
    return __assign.apply(this, arguments);
}

export function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

export function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

export function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

export function __esDecorate(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};

export function __runInitializers(thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};

export function __propKey(x) {
    return typeof x === "symbol" ? x : "".concat(x);
};

export function __setFunctionName(f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};

export function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

export function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

export function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

export var __createBinding = Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
});

export function __exportStar(m, o) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
}

export function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

export function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

/** @deprecated */
export function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

/** @deprecated */
export function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

export function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

export function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

export function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

export function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
}

export function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

export function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};

var __setModuleDefault = Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
};

var ownKeys = function(o) {
    ownKeys = Object.getOwnPropertyNames || function (o) {
        var ar = [];
        for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
        return ar;
    };
    return ownKeys(o);
};

export function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
    __setModuleDefault(result, mod);
    return result;
}

export function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}

export function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

export function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

export function __classPrivateFieldIn(state, receiver) {
    if (receiver === null || (typeof receiver !== "object" && typeof receiver !== "function")) throw new TypeError("Cannot use 'in' operator on non-object");
    return typeof state === "function" ? receiver === state : state.has(receiver);
}

export function __addDisposableResource(env, value, async) {
    if (value !== null && value !== void 0) {
        if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
        var dispose, inner;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
            if (async) inner = dispose;
        }
        if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
        if (inner) dispose = function() { try { inner.call(this); } catch (e) { return Promise.reject(e); } };
        env.stack.push({ value: value, dispose: dispose, async: async });
    }
    else if (async) {
        env.stack.push({ async: true });
    }
    return value;

}

var _SuppressedError = typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

export function __disposeResources(env) {
    function fail(e) {
        env.error = env.hasError ? new _SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
        env.hasError = true;
    }
    var r, s = 0;
    function next() {
        while (r = env.stack.pop()) {
            try {
                if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
                if (r.dispose) {
                    var result = r.dispose.call(r.value);
                    if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
                }
                else s |= 1;
            }
            catch (e) {
                fail(e);
            }
        }
        if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
        if (env.hasError) throw env.error;
    }
    return next();
}

export function __rewriteRelativeImportExtension(path, preserveJsx) {
    if (typeof path === "string" && /^\.\.?\//.test(path)) {
        return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function (m, tsx, d, ext, cm) {
            return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : (d + ext + "." + cm.toLowerCase() + "js");
        });
    }
    return path;
}

export default {
    __extends: __extends,
    __assign: __assign,
    __rest: __rest,
    __decorate: __decorate,
    __param: __param,
    __esDecorate: __esDecorate,
    __runInitializers: __runInitializers,
    __propKey: __propKey,
    __setFunctionName: __setFunctionName,
    __metadata: __metadata,
    __awaiter: __awaiter,
    __generator: __generator,
    __createBinding: __createBinding,
    __exportStar: __exportStar,
    __values: __values,
    __read: __read,
    __spread: __spread,
    __spreadArrays: __spreadArrays,
    __spreadArray: __spreadArray,
    __await: __await,
    __asyncGenerator: __asyncGenerator,
    __asyncDelegator: __asyncDelegator,
    __asyncValues: __asyncValues,
    __makeTemplateObject: __makeTemplateObject,
    __importStar: __importStar,
    __importDefault: __importDefault,
    __classPrivateFieldGet: __classPrivateFieldGet,
    __classPrivateFieldSet: __classPrivateFieldSet,
    __classPrivateFieldIn: __classPrivateFieldIn,
    __addDisposableResource: __addDisposableResource,
    __disposeResources: __disposeResources,
    __rewriteRelativeImportExtension: __rewriteRelativeImportExtension,
};

(async function(){performance.mark("code/didStartRenderer");let w=window.vscode,k=w.process;function R(a){performance.mark("code/willShowPartsSplash"),_(a),performance.mark("code/didShowPartsSplash")}function _(a){let i=a.partsSplash;i&&(a.autoDetectHighContrast&&a.colorScheme.highContrast?(a.colorScheme.dark&&i.baseTheme!=="hc-black"||!a.colorScheme.dark&&i.baseTheme!=="hc-light")&&(i=void 0):a.autoDetectColorScheme&&(a.colorScheme.dark&&i.baseTheme!=="vs-dark"||!a.colorScheme.dark&&i.baseTheme!=="vs")&&(i=void 0)),i&&a.extensionDevelopmentPath&&(i.layoutInfo=void 0);let d,c,p;i?(d=i.baseTheme,c=i.colorInfo.editorBackground,p=i.colorInfo.foreground):a.autoDetectHighContrast&&a.colorScheme.highContrast?a.colorScheme.dark?(d="hc-black",c="#000000",p="#FFFFFF"):(d="hc-light",c="#FFFFFF",p="#000000"):a.autoDetectColorScheme&&(a.colorScheme.dark?(d="vs-dark",c="#1E1E1E",p="#CCCCCC"):(d="vs",c="#FFFFFF",p="#000000"));let u=document.createElement("style");if(u.className="initialShellColors",window.document.head.appendChild(u),u.textContent=`body {	background-color: ${c}; color: ${p}; margin: 0; padding: 0; }`,typeof i?.zoomLevel=="number"&&typeof w?.webFrame?.setZoomLevel=="function"&&w.webFrame.setZoomLevel(i.zoomLevel),i?.layoutInfo){let{layoutInfo:e,colorInfo:o}=i,n=e.modernUI===!0,v=e.modernUICompact===!0?0:4,y=4,m=1,x=8,l=e.titleBarHeight,g=e.statusBarHeight,B=document.createElement("div");if(B.id="monaco-parts-splash",B.className=d??"vs-dark",e.windowBorder&&o.windowBorder){let t=document.createElement("div");t.style.position="absolute",t.style.width="calc(100vw - 2px)",t.style.height="calc(100vh - 2px)",t.style.zIndex="1",t.style.border="1px solid var(--window-border-color)",t.style.setProperty("--window-border-color",o.windowBorder),e.windowBorderRadius&&(t.style.borderRadius=e.windowBorderRadius),B.appendChild(t)}let S=(t,r)=>{t.style.position="absolute",t.style.top=`${r.top}px`,typeof r.bottom=="number"&&(t.style.bottom=`${r.bottom}px`),typeof r.left=="number"&&(t.style.left=`${r.left}px`),typeof r.right=="number"&&(t.style.right=`${r.right}px`),typeof r.width=="number"&&(t.style.width=`${r.width}px`),typeof r.height=="number"&&(t.style.height=`${r.height}px`)},C=(t,r)=>{t.style.position="absolute",t.style.top=`${r.top}px`,t.style.left=`${r.left}px`,t.style.width=`${r.width}px`,t.style.height=`${r.height}px`},z=e.modernUICompact===!0&&e.activityBarWidth>0?{top:l+(l===0?y:0),left:e.sideBarSide==="left"?y:window.innerWidth-e.activityBarWidth,width:Math.max(0,e.activityBarWidth-y),height:window.innerHeight-l-g-y-(l===0?y:0)}:void 0,I=e.modernUICompact===!0?[e.partBounds?.activityBar,e.partBounds?.sideBar,e.partBounds?.auxiliaryBar,e.partBounds?.editor,e.partBounds?.panel].filter(t=>!!t):[],T=e.modernUICompact===!0?[e.partBounds?.activityBar??z,e.partBounds?.sideBar,e.partBounds?.auxiliaryBar,e.partBounds?.editor,e.partBounds?.panel].filter(t=>!!t):[],E=I.length>0&&T.length>0?{left:Math.min(...T.map(t=>t.left)),right:Math.max(...T.map(t=>t.left+t.width)),top:Math.min(...I.map(t=>t.top)),bottom:Math.max(...I.map(t=>t.top+t.height))}:void 0,$=e.sideBarSide==="left"?["activityBar","sideBar","editor","auxiliaryBar"]:["auxiliaryBar","editor","sideBar","activityBar"],L={activityBar:e.activityBarWidth>0,sideBar:e.sideBarWidth>0,editor:!0,auxiliaryBar:e.auxiliaryBarWidth>0},J=$.find(t=>L[t]),Z=[...$].reverse().find(t=>L[t]),D=t=>({left:J===t,right:Z===t,top:!0,bottom:!0}),h=(t,r)=>n?D(t)[r]?y:v:0,M=o.modernActivityBarBorder??o.surfaceBorder??o.agentsPanelBorder??o.editorGroupBorder??"transparent",W=(t,r,s,f={left:!0,right:!0,top:!0,bottom:!0},Q=o.surfaceBorder??o.agentsPanelBorder??o.editorGroupBorder??"transparent")=>{if(t.style.boxSizing="border-box",e.modernUICompact===!0){let b=s?.outerEdges??(s&&E?{left:s.left===E.left,right:s.left+s.width===E.right,top:s.top===E.top,bottom:s.top+s.height===E.bottom}:f);t.style.borderStyle="solid",t.style.borderColor=Q,t.style.borderWidth=`${b.top?m:0}px ${m}px ${m}px ${b.left?m:0}px`,t.style.borderRadius=[b.top&&b.left?x:0,b.top&&b.right?x:0,b.bottom&&b.right?x:0,b.bottom&&b.left?x:0].map(Y=>`${Y}px`).join(" ")}else t.style.border=`${m}px solid ${o.agentsPanelBorder??o.editorGroupBorder??"transparent"}`,t.style.borderRadius=`${x}px`;t.style.backgroundColor=r??o.editorBackground??o.background,t.style.overflow="hidden"},q=`calc(100% - ${l+g}px)`,X=n?`calc(100% - ${l+g+v}px)`:q,O=(window.document.hasFocus()?o.modernActivityBarBackground:o.modernActivityBarInactiveBackground??o.modernActivityBarBackground)??o.activityBarBackground;if(e.auxiliaryBarWidth===Number.MAX_SAFE_INTEGER?e.auxiliaryBarWidth=window.innerWidth-e.activityBarWidth:e.auxiliaryBarWidth=Math.min(e.auxiliaryBarWidth,window.innerWidth-(e.activityBarWidth+e.editorPartMinWidth+e.sideBarWidth)),e.sideBarWidth=Math.min(e.sideBarWidth,window.innerWidth-(e.activityBarWidth+e.editorPartMinWidth+e.auxiliaryBarWidth)),e.titleBarHeight>0){let t=document.createElement("div");if(t.style.position="absolute",t.style.width="100%",t.style.height=`${e.titleBarHeight}px`,t.style.left="0",t.style.top="0",t.style.backgroundColor=n?"transparent":`${o.titleBarBackground}`,t.style["-webkit-app-region"]="drag",B.appendChild(t),!n&&o.titleBarBorder){let r=document.createElement("div");r.style.position="absolute",r.style.width="100%",r.style.height="1px",r.style.left="0",r.style.bottom="0",r.style.borderBottom=`1px solid ${o.titleBarBorder}`,t.appendChild(r)}}if(e.activityBarWidth>0){let t=document.createElement("div"),r=e.partBounds?.activityBar;if(n&&r?C(t,r):e.modernUICompact===!0?S(t,{top:l+(l===0?y:0),bottom:g+y,...e.sideBarSide==="left"?{left:y}:{right:y},width:Math.max(0,e.activityBarWidth-y)}):(t.style.position="absolute",t.style.width=`${e.activityBarWidth}px`,t.style.height=X,t.style.top=`${l}px`,e.sideBarSide==="left"?t.style.left="0":t.style.right="0"),e.modernUICompact===!0)W(t,O,r,D("activityBar"),M);else if(n){let s=`${x}px`;t.style.boxSizing="border-box",t.style.backgroundColor=O??"transparent",t.style.border=`${m}px solid ${M}`,t.style.borderRadius=e.sideBarWidth===0?s:e.sideBarSide==="left"?`${s} 0 0 ${s}`:`0 ${s} ${s} 0`,t.style.overflow="hidden"}else t.style.backgroundColor=`${o.activityBarBackground}`;if(B.appendChild(t),!n&&o.activityBarBorder){let s=document.createElement("div");s.style.position="absolute",s.style.width="1px",s.style.height="100%",s.style.top="0",e.sideBarSide==="left"?(s.style.right="0",s.style.borderRight=`1px solid ${o.activityBarBorder}`):(s.style.left="0",s.style.borderLeft=`1px solid ${o.activityBarBorder}`),t.appendChild(s)}}if(e.sideBarWidth>0){let t=D("sideBar"),r=n&&t[e.sideBarSide==="left"?"left":"right"]?y:0,s=document.createElement("div");if(n&&e.partBounds?.sideBar?C(s,e.partBounds.sideBar):e.sideBarSide==="left"?S(s,{top:l+(l===0?h("sideBar","top"):0),bottom:g+h("sideBar","bottom"),left:e.activityBarWidth+r,width:n?Math.max(0,e.sideBarWidth-r-m*2):e.sideBarWidth}):S(s,{top:l+(l===0?h("sideBar","top"):0),bottom:g+h("sideBar","bottom"),right:e.activityBarWidth+r,width:n?Math.max(0,e.sideBarWidth-r-m*2):e.sideBarWidth}),n?W(s,o.surfaceBackground??o.agentsPanelBackground??o.sideBarBackground,e.partBounds?.sideBar,t):s.style.backgroundColor=`${o.sideBarBackground}`,B.appendChild(s),!n&&o.sideBarBorder){let f=document.createElement("div");f.style.position="absolute",f.style.width="1px",f.style.height="100%",f.style.top="0",f.style.right="0",e.sideBarSide==="left"?f.style.borderRight=`1px solid ${o.sideBarBorder}`:(f.style.left="0",f.style.borderLeft=`1px solid ${o.sideBarBorder}`),s.appendChild(f)}}if(e.auxiliaryBarWidth>0){let t=D("auxiliaryBar"),r=document.createElement("div");if(n&&e.partBounds?.auxiliaryBar?C(r,e.partBounds.auxiliaryBar):e.sideBarSide==="left"?S(r,{top:l+(l===0?h("auxiliaryBar","top"):0),bottom:g+h("auxiliaryBar","bottom"),right:h("auxiliaryBar","right"),width:n?Math.max(0,e.auxiliaryBarWidth-h("auxiliaryBar","right")-v-m*2):e.auxiliaryBarWidth}):S(r,{top:l+(l===0?h("auxiliaryBar","top"):0),bottom:g+h("auxiliaryBar","bottom"),left:h("auxiliaryBar","left"),width:n?Math.max(0,e.auxiliaryBarWidth-h("auxiliaryBar","left")-v-m*2):e.auxiliaryBarWidth}),n?W(r,o.sideBarBackground,e.partBounds?.auxiliaryBar,t):r.style.backgroundColor=`${o.sideBarBackground}`,B.appendChild(r),!n&&o.sideBarBorder){let s=document.createElement("div");s.style.position="absolute",s.style.width="1px",s.style.height="100%",s.style.top="0",e.sideBarSide==="left"?(s.style.left="0",s.style.borderLeft=`1px solid ${o.sideBarBorder}`):(s.style.right="0",s.style.borderRight=`1px solid ${o.sideBarBorder}`),r.appendChild(s)}}if(n&&(e.partBounds?.editor||!e.partBounds)){let t=D("editor"),r=document.createElement("div");if(e.partBounds?.editor)C(r,e.partBounds.editor);else{let s=(e.sideBarSide==="left"?e.activityBarWidth+e.sideBarWidth:e.auxiliaryBarWidth)+h("editor","left"),f=(e.sideBarSide==="left"?e.auxiliaryBarWidth:e.activityBarWidth+e.sideBarWidth)+h("editor","right");S(r,{top:l+(l===0?h("editor","top"):0),bottom:g+h("editor","bottom"),left:s,right:f})}W(r,o.editorBackground,e.partBounds?.editor,t,o.editorBorder??o.surfaceBorder??o.editorGroupBorder??"transparent"),B.appendChild(r)}if(n&&e.partBounds?.panel){let t=document.createElement("div");C(t,e.partBounds.panel),W(t,o.panelBackground??o.editorBackground,e.partBounds.panel),B.appendChild(t)}if(e.statusBarHeight>0){let t=document.createElement("div");if(t.style.position="absolute",t.style.width="100%",t.style.height=`${e.statusBarHeight}px`,t.style.bottom="0",t.style.left="0",n?t.style.backgroundColor="transparent":a.workspace&&o.statusBarBackground?t.style.backgroundColor=o.statusBarBackground:!a.workspace&&o.statusBarNoFolderBackground&&(t.style.backgroundColor=o.statusBarNoFolderBackground),B.appendChild(t),!n&&o.statusBarBorder){let r=document.createElement("div");r.style.position="absolute",r.style.width="100%",r.style.height="1px",r.style.top="0",r.style.borderTop=`1px solid ${o.statusBarBorder}`,t.appendChild(r)}}window.document.body.appendChild(B)}}async function A(a){let i=await F();a?.beforeImport?.(i);let{enableDeveloperKeybindings:d,removeDeveloperKeybindingsAfterLoad:c,developerDeveloperKeybindingsDisposable:p,forceDisableShowDevtoolsOnError:u}=P(i,a);U(i);let e=new URL(`${H(i.appRoot,{isWindows:k.platform==="win32",scheme:"vscode-file",fallbackAuthority:"vscode-app"})}/out/`);globalThis._VSCODE_FILE_ROOT=e.toString(),globalThis._VSCODE_PRODUCT_JSON={...i.product},G(i,e);try{let o;k.env.VSCODE_DEV&&globalThis._VSCODE_USE_RELATIVE_IMPORTS?o="../../../workbench/workbench.desktop.main.js":o=new URL("vs/workbench/workbench.desktop.main.js",e).href;let n=await import(o);return p&&c&&p(),{result:n,configuration:i}}catch(o){throw N(o,d&&!u),o}}async function F(){let a=setTimeout(()=>{console.error("[resolve window config] Could not resolve window configuration within 10 seconds, but will continue to wait...")},1e4);performance.mark("code/willWaitForWindowConfig");let i=await w.context.resolveConfiguration();return performance.mark("code/didWaitForWindowConfig"),clearTimeout(a),i}function P(a,i){let{forceEnableDeveloperKeybindings:d,disallowReloadKeybinding:c,removeDeveloperKeybindingsAfterLoad:p,forceDisableShowDevtoolsOnError:u}=typeof i?.configureDeveloperSettings=="function"?i.configureDeveloperSettings(a):{forceEnableDeveloperKeybindings:!1,disallowReloadKeybinding:!1,removeDeveloperKeybindingsAfterLoad:!1,forceDisableShowDevtoolsOnError:!1},o=!!(!!k.env.VSCODE_DEV||d),n;return o&&(n=K(c)),{enableDeveloperKeybindings:o,removeDeveloperKeybindingsAfterLoad:p,developerDeveloperKeybindingsDisposable:n,forceDisableShowDevtoolsOnError:u}}function K(a){let i=w.ipcRenderer,d=function(o){return[o.ctrlKey?"ctrl-":"",o.metaKey?"meta-":"",o.altKey?"alt-":"",o.shiftKey?"shift-":"",o.keyCode].join("")},c=k.platform==="darwin"?"meta-alt-73":"ctrl-shift-73",p="123",u=k.platform==="darwin"?"meta-82":"ctrl-82",e=function(o){let n=d(o);n===c||n===p?i.send("vscode:toggleDevTools"):n===u&&!a&&i.send("vscode:reloadWindow")};return window.addEventListener("keydown",e),function(){e&&(window.removeEventListener("keydown",e),e=void 0)}}function U(a){globalThis._VSCODE_NLS_MESSAGES=a.nls.messages,globalThis._VSCODE_NLS_LANGUAGE=a.nls.language;let i=a.nls.language||"en";i==="zh-tw"?i="zh-Hant":i==="zh-cn"&&(i="zh-Hans"),window.document.documentElement.setAttribute("lang",i)}function N(a,i){i&&w.ipcRenderer.send("vscode:openDevTools"),console.error(`[uncaught exception]: ${a}`),a&&typeof a!="string"&&a.stack&&console.error(a.stack)}function H(a,i){let d=a.replace(/\\/g,"/");d.length>0&&d.charAt(0)!=="/"&&(d=`/${d}`);let c;return i.isWindows&&d.startsWith("//")?c=encodeURI(`${i.scheme||"file"}:${d}`):c=encodeURI(`${i.scheme||"file"}://${i.fallbackAuthority||""}${d}`),c.replace(/#/g,"%23")}function G(a,i){if(!globalThis._VSCODE_DISABLE_CSS_IMPORT_MAP&&Array.isArray(a.cssModules)&&a.cssModules.length>0){performance.mark("code/willAddCssLoader"),globalThis._VSCODE_CSS_LOAD=function(e){let o=document.createElement("link");o.setAttribute("rel","stylesheet"),o.setAttribute("type","text/css"),o.setAttribute("href",e),window.document.head.appendChild(o)};let d={imports:{}};for(let e of a.cssModules){let o=new URL(e,i).href,n=`globalThis._VSCODE_CSS_LOAD('${o}');
`,v=new Blob([n],{type:"application/javascript"});d.imports[o]=URL.createObjectURL(v)}let c=window.trustedTypes?.createPolicy("vscode-bootstrapImportMap",{createScript(e){return e}}),p=JSON.stringify(d,void 0,2),u=document.createElement("script");u.type="importmap",u.setAttribute("nonce","0c6a828f1297"),u.textContent=c?.createScript(p)??p,window.document.head.appendChild(u),performance.mark("code/didAddCssLoader")}}let{result:V,configuration:j}=await A({configureDeveloperSettings:function(a){return{forceDisableShowDevtoolsOnError:typeof a.extensionTestsPath=="string"||a["enable-smoke-test-driver"]===!0,forceEnableDeveloperKeybindings:Array.isArray(a.extensionDevelopmentPath)&&a.extensionDevelopmentPath.length>0,removeDeveloperKeybindingsAfterLoad:!0}},beforeImport:function(a){R(a),Object.defineProperty(window,"vscodeWindowId",{get:()=>a.windowId}),window.requestIdleCallback(()=>{let i=document.createElement("canvas");i.getContext("2d")?.clearRect(0,0,i.width,i.height),i.remove()},{timeout:50}),performance.mark("code/willLoadWorkbenchMain")}});performance.mark("code/didLoadWorkbenchMain"),V.main(j)})();
//# sourceMappingURL=https://main.vscode-cdn.net/sourcemaps/645f29cc3176500b4b5762ba887cf2a7f0ffdf2c/core/vs\code\electron-browser\workbench\workbench.js.map
