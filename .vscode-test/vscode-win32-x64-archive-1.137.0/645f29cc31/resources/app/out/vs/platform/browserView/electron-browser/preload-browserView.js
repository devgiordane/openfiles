/*!--------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
"use strict";const O="comment";let v={addComment:"Add Comment",addCommentPlaceholder:"Add a comment",commentOnSelectedElement:"Comment on selected element",elementComment:"Element comment {0}",elementCommentWithBody:"Element comment {0}: {1}",emptyElementComment:"Empty element comment {0}",removeComment:"Remove Comment",removeElementComment:"Remove element comment"};function F(){const{contextBridge:M,ipcRenderer:e}=require("electron"),t={mac:{always:new Set(["arrowup","arrowdown","arrowleft","arrowright","backspace","delete"]),noShift:new Set(["a","c","v","x","z"]),withShift:new Set(["v","z"])},nonMac:{always:new Set(["arrowup","arrowdown","arrowleft","arrowright","home","end","backspace","delete"]),noShift:new Set(["a","c","v","x","z","y"]),withShift:new Set(["v","z"])}};window.addEventListener("keydown",o=>{if(!(o instanceof KeyboardEvent)||!o.isTrusted||o.defaultPrevented)return;const c=o.key==="Escape"||/^F\d+$/.test(o.key)||o.key.startsWith("Audio")||o.key.startsWith("Media")||o.key.startsWith("Browser");if(!(o.ctrlKey||o.altKey||o.metaKey)&&!c||o.key==="Control"||o.key==="Shift"||o.key==="Alt"||o.key==="Meta")return;const h=navigator.platform.indexOf("Mac")>=0;if(o.altKey&&!o.ctrlKey&&!o.metaKey&&(h||/^Numpad\d+$/.test(o.code))||o.key==="F10"&&o.shiftKey&&!o.ctrlKey&&!o.altKey&&!o.metaKey)return;if((h?o.metaKey:o.ctrlKey)&&!o.altKey){let w=o.key.toLowerCase();if(!/^[a-z]$/.test(w)&&/^Key[A-Z]$/.test(o.code)&&(w=o.code.slice(3).toLowerCase()),[t[h?"mac":"nonMac"].always,t[h?"mac":"nonMac"][o.shiftKey?"withShift":"noShift"]].some(x=>x.has(w))||h&&o.ctrlKey&&!o.shiftKey&&w===" ")return}o.preventDefault(),o.stopPropagation(),e.send("vscode:browserView:keydown",{key:o.key,keyCode:o.keyCode,code:o.code,ctrlKey:o.ctrlKey,shiftKey:o.shiftKey,altKey:o.altKey,metaKey:o.metaKey,repeat:o.repeat})});const n=new g((o,c)=>{const h=a(o);return e.send("vscode:browserView:elementPicked",{elementId:h,comment:c}),h},o=>e.send("vscode:browserView:elementCommentRemoved",o),()=>e.send("vscode:browserView:elementPickStopped")),i=new T(o=>e.send("vscode:browserView:areaPicked",o),()=>e.send("vscode:browserView:areaPickStopped")),s=new Map,r=new FinalizationRegistry(o=>{s.delete(o)});function a(o){const c=`el-${Date.now()}-${Math.random().toString(36).slice(2)}`;return s.set(c,new WeakRef(o)),r.register(o,c),c}let m;window.addEventListener("contextmenu",o=>{if(!o.isTrusted)return;const c=n.resolveContextMenuTarget(o);if(c){const h=[c],_=window.getSelection();_&&!_.isCollapsed&&h.push(_.anchorNode,_.focusNode),m={ref:new WeakRef($(h)??c),anchor:{x:o.clientX,y:o.clientY}}}else m=void 0},{capture:!0}),e.on("vscode:browserView:setTheme",(o,c)=>{n.setTheme(c),i.setTheme(c)}),e.on("vscode:browserView:setLocalizedStrings",(o,c)=>{v=c,n.updateLocalizedStrings()}),e.on("vscode:browserView:startElementPicker",(o,c)=>{n.start(c)}),e.on("vscode:browserView:stopElementPicker",o=>{n.stop()}),e.on("vscode:browserView:startAreaPicker",o=>{i.start()}),e.on("vscode:browserView:stopAreaPicker",o=>{i.stop()}),e.on("vscode:browserView:highlightElement",(o,{elementId:c})=>{const h=l(c);h&&n.highlight(h)}),e.on("vscode:browserView:showElementComment",(o,{elementId:c})=>{const h=l(c);h&&m&&n.comment(h,m.anchor)}),e.on("vscode:browserView:hideHighlight",o=>{n.hideHighlight()}),e.on("vscode:browserView:setElementComments",(o,c)=>{n.updateComments(c)});const l=o=>{switch(o){case"active":return document.activeElement;case"context-menu-target":return m?.ref.deref()??null;default:return s.get(o)?.deref()??null}},d={getSelectedText(){try{return window.getSelection()?.toString()??""}catch{return""}}},p=`frame-${Date.now()}-${Math.random().toString(36).slice(2)}`,u={getElement:l,getFrameToken(){return p}};try{M.exposeInIsolatedWorld(999,"browserViewAPI",d),M.exposeInMainWorld("__vscode_helpers",u)}catch(o){console.error(o)}e.send("vscode:browserView:preloadReady",p)}function $(M){const e=M.filter(r=>!!r),t=[...new Set(e.map(r=>r instanceof Element?r:r.parentElement).filter(r=>!!r))];if(t.length===0)return;const n=r=>{for(let a=r;a;a=a.parentElement){const m=a instanceof HTMLElement?a.offsetWidth:a.clientWidth,l=a instanceof HTMLElement?a.offsetHeight:a.clientHeight;if(m>0&&l>0)return a}return r};if(t.length===1)return n(t[0]);const i=[];for(let r=t[0];r;r=r.parentElement)i.unshift(r);let s=i;for(let r=1;r<t.length;r++){const a=[];for(let d=t[r];d;d=d.parentElement)a.unshift(d);let m=0;const l=Math.min(s.length,a.length);for(;m<l&&s[m]===a[m];)m++;if(s=s.slice(0,m),s.length===0)return}return n(s[s.length-1])}class g{constructor(e,t,n){this._onPicked=e;this._onCommentRemoved=t;this._onStopped=n;this._selectionActive=!1;this._continuous=!1;this._commentMode=!1;this._comments=new Map;this._pendingComments=new Map;this._scheduledCommentPins=new Map;this._dismissedCommentOnPointerDown=!1;this._commentPointerInteraction=!1;this._commentBackdropRequest=0;this._commentPreviewCollapsing=!1;this._reducedMotion=!1;this._onPointerMove=e=>{if(!this._selectionActive)return;const t=e.composedPath().includes(this._shadowHost);if(this._commentTarget){t||(this._commentPointerInteraction=!0);return}const n=this._pendingCommentInteractionId?this._pendingComments.get(this._pendingCommentInteractionId):void 0;if(n){t||(n.pointerInteraction=!0);return}if(this._commentPreviewElementId||this._externalHighlightTarget||t)return;if(e.preventDefault(),e.stopPropagation(),!this._dragStart){this._updateHighlight(this._pickElementAt(e.clientX,e.clientY));return}const i=Math.abs(e.clientX-this._dragStart.x),s=Math.abs(e.clientY-this._dragStart.y);if(i<g._DRAG_THRESHOLD_PX&&s<g._DRAG_THRESHOLD_PX)return;const r=Math.min(this._dragStart.x,e.clientX),a=Math.min(this._dragStart.y,e.clientY);this._dragbox.style.display="block",this._dragbox.style.left=`${r}px`,this._dragbox.style.top=`${a}px`,this._dragbox.style.width=`${i}px`,this._dragbox.style.height=`${s}px`,this._updateHighlight(this._pickRegionAncestor({x:r,y:a,width:i,height:s}))};this._onPointerLeave=()=>{if(!this._selectionActive)return;if(this._commentTarget){this._commentPointerInteraction=!0;return}const e=this._pendingCommentInteractionId?this._pendingComments.get(this._pendingCommentInteractionId):void 0;if(e){e.pointerInteraction=!0;return}this._commentPreviewElementId||this._externalHighlightTarget||this._dragStart||this._updateHighlight(this._focusedTarget)};this._onPointerDown=e=>{if(this._selectionActive&&(this._dismissedCommentOnPointerDown=!1,!e.composedPath().includes(this._shadowHost))){if(this._pendingCommentInteractionId){e.preventDefault(),e.stopPropagation();return}if(this._commentTarget){this._dismissedCommentOnPointerDown=!0,e.preventDefault(),e.stopPropagation();return}this._dragStart={x:e.clientX,y:e.clientY},this._dragStartTarget=this._pickElementAt(e.clientX,e.clientY),this._cursorStylesheet&&(this._cursorStylesheet.textContent=g._CURSOR_CROSSHAIR),e.preventDefault(),e.stopPropagation()}};this._onPointerUp=e=>{if(!this._selectionActive)return;if(this._dismissedCommentOnPointerDown){e.preventDefault(),e.stopPropagation();const s=this._commentTarget;s&&window.setTimeout(()=>{this._commentTarget===s&&this._finishCommentInteraction()});return}if(e.composedPath().includes(this._shadowHost)||!this._dragStart)return;const t=Math.abs(e.clientX-this._dragStart.x),n=Math.abs(e.clientY-this._dragStart.y),i=this._dragStart;if(this._dragStart=void 0,this._cursorStylesheet&&(this._cursorStylesheet.textContent=g._CURSOR_DEFAULT),t<g._DRAG_THRESHOLD_PX&&n<g._DRAG_THRESHOLD_PX){const s=this._dragStartTarget??this._pickElementAt(e.clientX,e.clientY);this._dragStartTarget=void 0,s&&this._commit(s,{x:e.clientX,y:e.clientY})}else{this._dragStartTarget=void 0,this._dragbox.style.display="none",this._updateHighlight(void 0);const s=Math.min(i.x,e.clientX),r=Math.min(i.y,e.clientY),a=this._pickRegionAncestor({x:s,y:r,width:t,height:n});a&&this._commit(a,{x:e.clientX,y:e.clientY})}e.preventDefault(),e.stopPropagation()};this._onClick=e=>{if(this._selectionActive){if(this._dismissedCommentOnPointerDown){this._dismissedCommentOnPointerDown=!1,e.preventDefault(),e.stopPropagation(),this._finishCommentInteraction();return}e.composedPath().includes(this._shadowHost)||(e.preventDefault(),e.stopPropagation())}};this._onFocusIn=e=>{if(!this._selectionActive||this._commentTarget||this._pendingCommentInteractionId||this._externalHighlightTarget||e.composedPath().includes(this._shadowHost))return;const t=this._getFocusedElement();this._focusedTarget=t?.matches(":focus-visible")?t:void 0,this._updateHighlight(this._focusedTarget)};this._onWindowBlur=()=>{!this._selectionActive||this._commentTarget||this._externalHighlightTarget||(this._focusedTarget=void 0,this._updateHighlight(void 0))};this._onKeyDown=e=>{if(this._selectionActive){if(e.key==="Escape"){if(this._commentTarget){const t=this._commentTarget;this._focusCommentTarget(t),this._finishCommentInteraction(),e.preventDefault(),e.stopPropagation();return}this.stop(),e.preventDefault(),e.stopPropagation()}else if(e.key==="Enter"&&!e.isComposing){if(this._pendingCommentInteractionId){e.preventDefault(),e.stopPropagation();return}const t=this._getFocusedElement();t&&(e.preventDefault(),e.stopPropagation(),this._commit(t))}}};const i=document.createElement("div");i.setAttribute("data-vscode-pick-host",""),i.style.cssText="position: absolute; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647; pointer-events: none;";const s=i.attachShadow({mode:"closed"});s.appendChild(g._buildStyle()),this._shadowHost=i;const r="http://www.w3.org/2000/svg",a=document.createElementNS(r,"svg");a.classList.add("comment-backdrop");const m=`vscode-comment-cutout-${Math.random().toString(36).slice(2)}`,l=document.createElementNS(r,"defs"),d=document.createElementNS(r,"mask");d.id=m,d.setAttribute("maskUnits","userSpaceOnUse"),d.setAttribute("x","0"),d.setAttribute("y","0"),d.setAttribute("width","100%"),d.setAttribute("height","100%");const p=document.createElementNS(r,"rect");p.setAttribute("width","100%"),p.setAttribute("height","100%"),p.setAttribute("fill","white");const u=document.createElementNS(r,"rect");u.setAttribute("fill","black"),d.append(p,u),l.appendChild(d);const o=document.createElementNS(r,"rect");o.classList.add("comment-backdrop-fill"),o.setAttribute("width","100%"),o.setAttribute("height","100%"),o.setAttribute("mask",`url(#${m})`);const c=document.createElementNS(r,"rect");c.classList.add("highlight-shape"),c.style.display="none",a.append(l,o,c),s.appendChild(a),this._commentBackdrop=a,this._commentBackdropCutout=u,this._highlightShape=c;const h=document.createElement("div");h.className="highlight",h.style.display="none",s.appendChild(h),this._highlight=h;const _=document.createElement("button");_.className="comment-preview-remove",_.type="button";const w=document.createElementNS(r,"svg");w.setAttribute("viewBox","0 0 16 16"),w.setAttribute("fill","currentColor"),w.setAttribute("aria-hidden","true");const P=document.createElementNS(r,"path");P.setAttribute("d","M3.854 3.146a.5.5 0 0 0-.708.708L7.293 8l-4.147 4.146a.5.5 0 0 0 .708.708L8 8.707l4.146 4.147a.5.5 0 0 0 .708-.708L8.707 8l4.147-4.146a.5.5 0 0 0-.708-.708L8 7.293 3.854 3.146Z"),w.appendChild(P),_.appendChild(w),_.title=v.removeComment,_.setAttribute("aria-label",v.removeElementComment),_.addEventListener("click",()=>{this._commentPreviewElementId&&this._removeComment(this._commentPreviewElementId)}),this._commentPreviewRemoveButton=_;const x=document.createElement("div");x.className="overlay",s.appendChild(x),this._overlay=x;const A=document.createElement("div");A.className="label",A.style.display="none",s.appendChild(A),this._label=A;const H=document.createElement("span");H.className="label-info",A.appendChild(H);const B=document.createElement("span");B.className="label-selector",H.appendChild(B),this._labelSelector=B;const R=document.createElement("span");R.className="label-classes",H.appendChild(R),this._labelClasses=R;const D=document.createElement("span");D.className="label-dims",A.appendChild(D),this._labelDims=D;const E=document.createElement("div");E.className="comment-preview-hit-area",E.style.display="none",s.appendChild(E),this._commentPreviewHitArea=E;const S=document.createElement("div");S.className="comment-surface comment-preview",S.style.display="none",S.setAttribute("role","note");const N=document.createElement("span");N.className="comment-preview-body",S.appendChild(N),S.appendChild(_),E.appendChild(S),this._commentPreview=S,this._commentPreviewBody=N,E.addEventListener("mouseenter",()=>this._cancelCommentPreviewHide()),E.addEventListener("mouseleave",()=>this._scheduleCommentPreviewHide()),E.addEventListener("focusin",()=>this._cancelCommentPreviewHide()),E.addEventListener("focusout",()=>this._scheduleCommentPreviewHide());const I=document.createElement("div");I.className="dragbox",I.style.display="none",s.appendChild(I),this._dragbox=I;const L=document.createElement("div");L.className="comment-layer",s.appendChild(L),this._commentLayer=L;const b=document.createElement("div");b.className="comment-surface comment-composer",b.style.display="none",b.setAttribute("role","dialog"),b.setAttribute("aria-label",v.commentOnSelectedElement),b.setAttribute("aria-modal","true"),L.appendChild(b),this._commentComposer=b;const y=document.createElement("textarea");y.className="comment-input",y.rows=1,y.placeholder=v.addCommentPlaceholder,y.setAttribute("aria-label",v.commentOnSelectedElement),y.addEventListener("input",()=>this._layoutCommentInput()),y.addEventListener("keydown",f=>{f.stopPropagation(),f.key==="Enter"&&!f.isComposing&&(f.preventDefault(),this._submitComment())}),y.addEventListener("keypress",f=>f.stopPropagation()),y.addEventListener("keyup",f=>f.stopPropagation()),b.appendChild(y),this._commentInput=y;const C=document.createElement("button");C.className="comment-send",C.type="button";const k=document.createElementNS(r,"svg");k.setAttribute("viewBox","0 0 16 16"),k.setAttribute("fill","currentColor"),k.setAttribute("aria-hidden","true");const z=document.createElementNS(r,"path");z.setAttribute("d","M8.5 3a.5.5 0 0 0-1 0v4.5H3a.5.5 0 0 0 0 1h4.5V13a.5.5 0 0 0 1 0V8.5H13a.5.5 0 0 0 0-1H8.5V3Z"),k.appendChild(z),C.appendChild(k),C.title=v.addComment,C.setAttribute("aria-label",v.addComment),C.addEventListener("click",()=>this._submitComment()),b.appendChild(C),this._commentSendButton=C,b.addEventListener("keydown",f=>{f.key==="Tab"&&(f.shiftKey&&f.target===y?(f.preventDefault(),C.focus()):!f.shiftKey&&f.target===C&&(f.preventDefault(),y.focus()))}),window.addEventListener("scroll",()=>this._onScrollOrResize(),{passive:!0,capture:!0}),window.addEventListener("resize",()=>this._onScrollOrResize())}static{this._DRAG_THRESHOLD_PX=4}static{this._COMMENT_PIN_SIZE=22}static{this._COMMENT_PIN_RESTORE_FRAMES=5}static{this._COMMENT_PIN_RESTORE_TIMEOUT=100}static{this._COMMENT_PREVIEW_HIT_PADDING=g._COMMENT_PIN_SIZE/2}static{this._COMMENT_PREVIEW_HIDE_DELAY=80}static{this._COMMENT_SURFACE_ANIMATION_DURATION=140}static{this._COMMENT_SUPPORTING_FADE_DURATION=120}static{this._CURSOR_DEFAULT="/* VS Code injected style */ * { cursor: default !important; }"}static{this._CURSOR_CROSSHAIR="/* VS Code injected style */ * { cursor: crosshair !important; }"}start(e){if(this._selectionActive)return this._updateSelectionOptions(e),!0;this._commentMode=e.mode===O,this._continuous=e.continuous??!1,this._ensureMounted(),this._selectionActive=!0,this._overlay.style.display="block";const t=document.createElement("style");if(t.textContent=g._CURSOR_DEFAULT,document.head.appendChild(t),this._cursorStylesheet=t,window.addEventListener("pointermove",this._onPointerMove,!0),document.addEventListener("pointerleave",this._onPointerLeave,!0),window.addEventListener("pointerdown",this._onPointerDown,!0),window.addEventListener("pointerup",this._onPointerUp,!0),window.addEventListener("click",this._onClick,!0),window.addEventListener("contextmenu",this._onClick,!0),window.addEventListener("focusin",this._onFocusIn,!0),window.addEventListener("blur",this._onWindowBlur),window.addEventListener("keydown",this._onKeyDown,!0),!this._externalHighlightTarget){const n=this._getFocusedElement();this._focusedTarget=e.highlightFocusedElement?n:void 0,this._updateHighlight(this._focusedTarget)}return!0}_updateSelectionOptions(e){const t=this._commentMode;this._commentMode=e.mode===O,this._continuous=e.continuous??!1,t&&!this._commentMode&&this._commentTarget&&this._closeCommentComposer(),e.highlightFocusedElement&&!this._commentTarget&&!this._commentPreviewElementId&&!this._externalHighlightTarget&&(this._focusedTarget=this._getFocusedElement(),this._updateHighlight(this._focusedTarget))}stop(){this._selectionActive&&(this._hideActiveCommentPreview(),this._selectionActive=!1,this._closeCommentComposer(),this._overlay.style.display="none",this._cursorStylesheet?.remove(),this._cursorStylesheet=void 0,window.removeEventListener("pointermove",this._onPointerMove,!0),document.removeEventListener("pointerleave",this._onPointerLeave,!0),window.removeEventListener("pointerdown",this._onPointerDown,!0),window.removeEventListener("pointerup",this._onPointerUp,!0),window.removeEventListener("click",this._onClick,!0),window.removeEventListener("contextmenu",this._onClick,!0),window.removeEventListener("focusin",this._onFocusIn,!0),window.removeEventListener("blur",this._onWindowBlur),window.removeEventListener("keydown",this._onKeyDown,!0),this._highlight.style.display="none",this._label.style.display="none",this._dragbox.style.display="none",this._dragStart=void 0,this._dragStartTarget=void 0,this._dismissedCommentOnPointerDown=!1,this._highlightTarget=void 0,this._focusedTarget=void 0,this._externalHighlightTarget&&this._updateHighlight(this._externalHighlightTarget),this._onStopped(),this._unmountWhenIdle())}setTheme(e){g._applyTheme(this._shadowHost,e),this._reducedMotion=e.reducedMotion??!1,this._shadowHost.classList.toggle("reduce-motion",this._reducedMotion)}updateLocalizedStrings(){this._applyLocalizedStrings()}resolveContextMenuTarget(e){return this._commentPreviewElementId&&e.composedPath().includes(this._shadowHost)?(this._hideActiveCommentPreview(),this._pickElementAt(e.clientX,e.clientY)):e.target instanceof Element?e.target:void 0}highlight(e){this._ensureMounted(),this._externalHighlightTarget=e,this._hideActiveCommentPreview(),this._updateHighlight(e)}hideHighlight(){this._externalHighlightTarget=void 0,!this._commentTarget&&(this._updateHighlight(void 0),this._unmountWhenIdle())}comment(e,t){this._externalHighlightTarget=void 0,this._selectionActive&&this.stop(),this.start({mode:O}),this._showCommentComposer(e,t,!0)}updateComments(e){if(e.comments){const t=new Map(e.comments.map((n,i)=>[n.elementId,{body:n.body,ordinal:i+1}]));for(const[n,i]of this._comments){const s=t.get(n);if(!s)this._commentPreviewElementId===n&&this._hideActiveCommentPreview(),i.pin.remove(),this._comments.delete(n);else{if(i.ordinal=s.ordinal,s.body===i.body)continue;i.body=s.body,this._commentPreviewElementId===n&&(this._setCommentPreviewBody(s.body),this._renderHighlight(i.target))}}for(const[n,i]of t){if(this._comments.has(n))continue;this._pendingComments.get(n)&&this._scheduleCommentPin(n,i.body,i.ordinal)}for(const n of this._scheduledCommentPins.keys())t.has(n)||this._discardPendingComment(n)}for(const t of e.pendingCommentIdsToDiscard??[])this._discardPendingComment(t);this._updateCommentPinNumbers(),this._unmountWhenIdle()}_onScrollOrResize(){this._commentPreviewCollapsing&&this._hideActiveCommentPreview(),this._cancelCommentAnimations(),this._highlightTarget&&this._renderHighlight(this._highlightTarget),this._commentBackdropTarget&&this._layoutCommentBackdrop(this._commentBackdropTarget);for(const e of this._comments.values())this._layoutCommentPin(e)}_getFocusedElement(){if(!document.hasFocus())return;let e=document.activeElement;for(;e?.shadowRoot?.activeElement;)e=e.shadowRoot.activeElement;if(!(!e||e===document.body||e===document.documentElement||e===this._shadowHost||e instanceof HTMLIFrameElement))return e}_pickElementAt(e,t){const n=document.elementsFromPoint(e,t);for(const i of n)if(!(i===this._shadowHost||this._shadowHost.contains(i)))return i}_pickRegionAncestor(e){const{x:t,y:n,width:i,height:s}=e,r=t+i,a=n+s,m=t+i/2,l=n+s/2,d=[];for(const[p,u]of[[t,n],[r,n],[t,a],[r,a],[m,n],[m,a],[t,l],[r,l],[m,l]]){const o=this._pickElementAt(p,u);o&&d.push(o)}return $(d)}_renderHighlight(e){const t=this._highlight,n=this._label,i=e.getBoundingClientRect(),s=window.scrollX||0,r=window.scrollY||0,a=window.innerHeight,m=document.documentElement.clientWidth,l=this._getVisibleTargetBounds(i),d=22;t.style.display="block",t.style.left=`${i.left+s}px`,t.style.top=`${i.top+r}px`,t.style.width=`${i.width}px`,t.style.height=`${i.height}px`,this._highlightShape.style.display="block",this._highlightShape.setAttribute("x",`${l.x}`),this._highlightShape.setAttribute("y",`${l.y}`),this._highlightShape.setAttribute("width",`${l.width}`),this._highlightShape.setAttribute("height",`${l.height}`),this._highlightShape.setAttribute("rx","2");const p=String(e.tagName||"").toLowerCase(),u=e.id?`#${e.id}`:"",o=e.classList.length?"."+[...e.classList].join("."):"";this._labelSelector.textContent=p+u,this._labelClasses.textContent=o,this._labelDims.textContent=`${Math.round(i.width)} \xD7 ${Math.round(i.height)}`,n.style.display="inline-flex";const c=i.top-d,h=Math.max(0,Math.min(a-d,c));n.style.left="0";const _=n.offsetWidth,w=i.left,P=Math.max(0,Math.min(w,m-_));if(n.style.left=`${P}px`,n.style.top=`${h}px`,this._commentPreview.style.display!=="none"){const x=this._layoutCommentSurface(this._commentPreview,l,m,a);this._commentPreviewElementId&&x==="above"&&this._elementsOverlap(n,this._commentPreview)&&(n.style.top=`${Math.max(0,Math.min(a-d,l.bottom+2))}px`)}this._commentComposer.style.display!=="none"&&this._layoutCommentSurface(this._commentComposer,l,m,a)}_elementsOverlap(e,t){const n=e.getBoundingClientRect(),i=t.getBoundingClientRect();return n.left<i.right&&n.right>i.left&&n.top<i.bottom&&n.bottom>i.top}_getVisibleTargetBounds(e){const t=Math.max(0,Math.min(e.left,window.innerWidth)),n=Math.max(t,Math.min(e.right,window.innerWidth)),i=Math.max(0,Math.min(e.top,window.innerHeight)),s=Math.max(i,Math.min(e.bottom,window.innerHeight));return new DOMRect(t,i,n-t,s-i)}_layoutCommentSurface(e,t,n,i){if(e===this._commentPreview){e.style.width="max-content",e.style.minWidth="0",e.style.maxWidth=`${Math.min(320,n-16)}px`;const o=this._commentPreviewElementId?this._comments.get(this._commentPreviewElementId):void 0;if(o){const c=o.pin.getBoundingClientRect();return this._layoutCommentSurfaceAtAnchor(e,{x:c.left+c.width/2,y:c.top+c.height/2},n,i)}}else if(e===this._commentComposer&&this._commentAnchor)return e.style.maxWidth=`${Math.min(320,n-16)}px`,this._layoutCommentSurfaceAtAnchor(e,{x:this._commentAnchor.x-window.scrollX,y:this._commentAnchor.y-window.scrollY},n,i);const s=e.offsetHeight,r=t.bottom,a=r+s<=i-8?"below":"above",m=r+s<=i-8?r:Math.max(0,t.top-s),l=e.offsetWidth,d=t.left+l<=n,p=d?"left":"right",u=d?Math.max(0,t.left):Math.max(0,t.right-l);return e.dataset.attachmentCorner=`${a==="below"?"top":"bottom"}-${p}`,this._setCommentSurfacePosition(e,u,m),a}_layoutCommentSurfaceAtAnchor(e,t,n,i){let r=e.offsetWidth;const a=Math.max(0,n-8-t.x),m=Math.max(0,t.x-8),l=r<=a||r>m&&a>=m,d=l?a:m;r>d&&(e.style.maxWidth=`${d}px`,r=e.offsetWidth);const p=e.offsetHeight,u=Math.max(0,i-8-t.y),o=Math.max(0,t.y-8),h=!(p<=o||p>u&&o>=u),_=h?"below":"above",w=l?"left":"right";e.dataset.attachmentCorner=`${h?"top":"bottom"}-${w}`;const P=l?t.x:t.x-r,x=h?t.y:Math.max(8,t.y-p);return this._setCommentSurfacePosition(e,P,x),_}_setCommentSurfacePosition(e,t,n){if(e!==this._commentPreview){e.style.left=`${t}px`,e.style.top=`${n}px`;return}const i=g._COMMENT_PREVIEW_HIT_PADDING;this._commentPreviewHitArea.style.left=`${t-i}px`,this._commentPreviewHitArea.style.top=`${n-i}px`,this._commentPreviewHitArea.style.width=`${e.offsetWidth+i*2}px`,this._commentPreviewHitArea.style.height=`${e.offsetHeight+i*2}px`,e.style.left=`${i}px`,e.style.top=`${i}px`}_updateHighlight(e){if(this._highlightTarget=e,!e){this._highlight.style.display="none",this._highlightShape.style.display="none",this._label.style.display="none";return}this._renderHighlight(e)}_commit(e,t){if(this._selectionActive){if(this._commentMode){this._showCommentComposer(e,t??this._getDefaultCommentAnchor(e),t!==void 0);return}requestAnimationFrame(()=>{this._continuous?this._updateHighlight(void 0):this.stop(),this._onPicked(e)})}}_getDefaultCommentAnchor(e){const t=e.getBoundingClientRect();return{x:t.left,y:t.bottom}}_showCommentComposer(e,t,n=!1){this._externalHighlightTarget=void 0,this._hideActiveCommentPreview(),this._commentTarget=e,this._commentPointerInteraction=n,this._commentAnchor={x:t.x+window.scrollX,y:t.y+window.scrollY},this._showCommentBackdrop(e),this._commentLayer.classList.add("composing"),this._commentInput.value="",this._commentComposer.style.display="flex",this._resizeCommentInput(),this._updateHighlight(e),this._animateCommentComposer(),this._commentInput.focus({preventScroll:!0}),requestAnimationFrame(()=>{this._commentTarget===e&&this._commentInput.focus({preventScroll:!0})})}_animateCommentComposer(){this._reducedMotion||(this._cancelCommentAnimations(),this._commentAnimation={surface:this._animateCommentSurface(this._commentComposer),supporting:[]})}_setCommentSurfaceTransformOrigin(e){const[t,n]=(e.dataset.attachmentCorner??"top-left").split("-");e.style.transformOrigin=`${n} ${t}`}_closeCommentComposer(){this._commentTarget=void 0,this._commentAnchor=void 0,this._hideCommentBackdrop(),this._commentLayer.classList.remove("composing"),this._commentComposer.style.display="none",this._commentInput.value="",this._cancelCommentAnimations(),this._updateHighlight(void 0)}_finishCommentInteraction(){this._continuous?this._closeCommentComposer():this.stop()}_submitComment(){const e=this._commentTarget,t=this._commentAnchor;if(!e||!t)return;const n=this._commentInput.value.replace(/\r?\n/g," "),i={target:e,anchor:t,body:n,pointerInteraction:this._commentPointerInteraction};this._commentLayer.classList.add("comment-capture-pending"),this._finishCommentInteraction();const s=this._onPicked(e,n);this._pendingComments.set(s,i),this._pendingCommentInteractionId=s}_restoreInteractionAfterComment(e,t){this._pendingCommentInteractionId===e&&(this._pendingCommentInteractionId=void 0,this._commentLayer.classList.remove("comment-capture-pending")),!this._commentTarget&&(t.pointerInteraction||this._focusCommentTarget(t.target))}_focusCommentTarget(e){if(!e.isConnected||!(e instanceof HTMLElement||e instanceof SVGElement))return;const t=e.hasAttribute("tabindex");t||(e.tabIndex=-1),e.focus({preventScroll:!0}),t||e.removeAttribute("tabindex")}_discardPendingComment(e){const t=this._pendingComments.get(e);this._pendingComments.delete(e),this._cancelScheduledCommentPin(e),t&&this._restoreInteractionAfterComment(e,t)}_cancelScheduledCommentPin(e){const t=this._scheduledCommentPins.get(e);t&&(window.clearTimeout(t.timeout),cancelAnimationFrame(t.animationFrame),this._scheduledCommentPins.delete(e))}_scheduleCommentPin(e,t,n){const i=this._scheduledCommentPins.get(e);if(i){i.body=t,i.ordinal=n;return}const s={body:t,ordinal:n,animationFrame:0,timeout:0};this._scheduledCommentPins.set(e,s);let r=0;const a=()=>{if(this._scheduledCommentPins.get(e)!==s)return;this._cancelScheduledCommentPin(e);const l=this._pendingComments.get(e);l&&this._createCommentPin(e,l.target,l.anchor,s.body,s.ordinal)},m=()=>{this._scheduledCommentPins.get(e)===s&&(r++,r>=g._COMMENT_PIN_RESTORE_FRAMES?a():s.animationFrame=requestAnimationFrame(m))};s.timeout=window.setTimeout(a,g._COMMENT_PIN_RESTORE_TIMEOUT),s.animationFrame=requestAnimationFrame(m)}_createCommentPin(e,t,n,i,s){this._ensureMounted();const r=this._comments.get(e);r&&this._commentPreviewElementId===e&&this._hideActiveCommentPreview(),r?.pin.remove();const a=this._pendingComments.get(e);this._pendingComments.delete(e);const m=t.getBoundingClientRect(),l={x:n.x-(m.left+window.scrollX),y:n.y-(m.top+window.scrollY)},d=document.createElement("div");d.className="comment-pin",d.tabIndex=0,d.setAttribute("role","note");const p=document.createElement("span");p.className="comment-pin-bubble";const u=document.createElement("span");u.className="comment-pin-number",p.appendChild(u),d.appendChild(p);const o=()=>{this._commentTarget||this._pendingCommentInteractionId||this._externalHighlightTarget||this._showCommentPreview(e,t,i)};d.addEventListener("pointermove",o),d.addEventListener("focusin",o),d.addEventListener("focusout",()=>this._scheduleCommentPreviewHide()),this._commentLayer.appendChild(d);const c={target:t,pin:d,numberElement:u,body:i,ordinal:s,offset:l};this._comments.set(e,c),this._updateCommentPinNumbers(),this._layoutCommentPin(c),a&&this._restoreInteractionAfterComment(e,a)}_updateCommentPinNumbers(){for(const e of this._comments.values()){const t=String(e.ordinal);e.numberElement.textContent=t,e.pin.title=e.body||this._formatLocalizedString(v.elementComment,t),e.pin.setAttribute("aria-label",e.body?this._formatLocalizedString(v.elementCommentWithBody,t,e.body):this._formatLocalizedString(v.emptyElementComment,t))}}_applyLocalizedStrings(){this._commentPreviewRemoveButton.title=v.removeComment,this._commentPreviewRemoveButton.setAttribute("aria-label",v.removeElementComment),this._commentComposer.setAttribute("aria-label",v.commentOnSelectedElement),this._commentInput.placeholder=v.addCommentPlaceholder,this._commentInput.setAttribute("aria-label",v.commentOnSelectedElement),this._commentSendButton.title=v.addComment,this._commentSendButton.setAttribute("aria-label",v.addComment),this._updateCommentPinNumbers()}_formatLocalizedString(e,...t){return e.replace(/\{(\d+)\}/g,(n,i)=>t[Number(i)]??"")}_layoutCommentPin(e){const t=e.target.getBoundingClientRect(),n=t.left+window.scrollX+e.offset.x,i=t.top+window.scrollY+e.offset.y,s=document.scrollingElement??document.documentElement,r=e.pin.offsetWidth/2,a=e.pin.offsetHeight/2,m=Math.max(r,Math.min(n,s.scrollWidth-r)),l=Math.max(a,Math.min(i,s.scrollHeight-a));e.pin.style.left=`${m}px`,e.pin.style.top=`${l}px`}_showCommentPreview(e,t,n){if(this._pendingCommentInteractionId||this._commentPreviewCollapsing)return;if(this._commentPreviewElementId===e){this._cancelCommentPreviewHide();return}this._hideActiveCommentPreview(),this._commentPreviewElementId=e;const i=this._comments.get(e);i&&(i.pin.classList.add("previewing"),i.pin.after(this._commentPreviewHitArea));const s=i?.body??n;this._setCommentPreviewBody(s),this._shadowHost.classList.add("comment-preview-active"),this._updateHighlight(t),this._showCommentBackdrop(t),i&&this._animateCommentPreview()}_setCommentPreviewBody(e){this._commentPreviewBody.textContent=e,this._commentPreview.title=e,this._commentPreview.classList.toggle("empty",!e),this._commentPreviewHitArea.style.display="block",this._commentPreview.style.display="flex"}_animateCommentPreview(e=!1){if(this._reducedMotion)return;const t=this._animateCommentSurface(this._commentPreview,e),n=e?[{opacity:1},{opacity:0}]:[{opacity:0},{opacity:1}],i=[];for(const s of[this._highlightShape,this._label]){if(s.style.display==="none")continue;const r=s.animate(n,{duration:g._COMMENT_SUPPORTING_FADE_DURATION,easing:"linear",fill:"both"});i.push(r)}return this._commentAnimation={surface:t,supporting:i},t}_animateCommentSurface(e,t=!1){return this._setCommentSurfaceTransformOrigin(e),e.animate(t?[{transform:"scale(1)"},{transform:"scale(0)"}]:[{transform:"scale(0)"},{transform:"scale(1)"}],{duration:g._COMMENT_SURFACE_ANIMATION_DURATION,easing:"cubic-bezier(0.2, 0, 0, 1)",fill:"forwards"})}_scheduleCommentPreviewHide(){this._commentPreviewCollapsing||(this._cancelCommentPreviewHide(),this._commentPreviewHideTimeout=window.setTimeout(()=>{this._commentPreviewHideTimeout=void 0;const t=(this._commentPreviewElementId?this._comments.get(this._commentPreviewElementId):void 0)?.pin.matches(":focus-within")??!1,n=this._commentPreviewHitArea.matches(":hover, :focus-within");t||n||this._collapseActiveCommentPreview()},g._COMMENT_PREVIEW_HIDE_DELAY))}_cancelCommentPreviewHide(){this._commentPreviewHideTimeout!==void 0&&(window.clearTimeout(this._commentPreviewHideTimeout),this._commentPreviewHideTimeout=void 0)}_collapseActiveCommentPreview(){if(this._commentPreviewCollapsing)return;const e=this._commentPreviewElementId,t=e?this._comments.get(e):void 0;if(!e||!t||this._reducedMotion){this._hideActiveCommentPreview();return}this._commentPreviewCollapsing=!0,this._shadowHost.classList.add("comment-preview-collapsing"),this._hideCommentBackdrop();const n=this._commentAnimation;let i;if(n){i=n.surface,i.reverse();for(const s of n.supporting)s.reverse()}else i=this._animateCommentPreview(!0);if(!i){this._hideActiveCommentPreview();return}i.onfinish=()=>{this._commentPreviewCollapsing&&this._commentPreviewElementId===e&&(this._commentPreviewCollapsing=!1,this._hideActiveCommentPreview())}}_cancelCommentAnimations(){if(this._commentAnimation){this._commentAnimation.surface.cancel();for(const e of this._commentAnimation.supporting)e.cancel();this._commentAnimation=void 0}}_hideActiveCommentPreview(){this._cancelCommentPreviewHide(),this._commentPreviewCollapsing=!1,this._shadowHost.classList.remove("comment-preview-collapsing"),this._commentPreviewElementId&&this._comments.get(this._commentPreviewElementId)?.pin.classList.remove("previewing"),this._commentPreviewElementId=void 0,this._shadowHost.classList.remove("comment-preview-active"),this._commentPreviewHitArea.style.display="none",this._commentPreview.style.display="none",this._hideCommentBackdrop(),this._commentTarget||this._updateHighlight(this._externalHighlightTarget),this._cancelCommentAnimations()}_removeComment(e){const t=this._comments.get(e);t&&(this._hideActiveCommentPreview(),t.pin.remove(),this._comments.delete(e),this._updateCommentPinNumbers(),this._unmountWhenIdle(),this._onCommentRemoved(e))}_layoutCommentInput(){this._resizeCommentInput(),this._layoutCommentComposer()}_resizeCommentInput(){this._commentInput.style.height="auto",this._commentInput.style.height=`${Math.min(this._commentInput.scrollHeight,96)}px`}_layoutCommentBackdrop(e){const t=this._getVisibleTargetBounds(e.getBoundingClientRect());this._commentBackdropCutout.setAttribute("x",`${t.x}`),this._commentBackdropCutout.setAttribute("y",`${t.y}`),this._commentBackdropCutout.setAttribute("width",`${t.width}`),this._commentBackdropCutout.setAttribute("height",`${t.height}`),this._commentBackdropCutout.setAttribute("rx","2")}_showCommentBackdrop(e){const t=++this._commentBackdropRequest;this._commentBackdropTarget=e,this._layoutCommentBackdrop(e),this._commentBackdrop.classList.remove("visible"),requestAnimationFrame(()=>{this._commentBackdropRequest===t&&this._commentBackdrop.classList.add("visible")})}_hideCommentBackdrop(){this._commentBackdropRequest++,this._commentBackdropTarget=void 0,this._commentBackdrop.classList.remove("visible")}_layoutCommentComposer(){this._commentTarget&&this._renderHighlight(this._commentTarget)}_ensureMounted(){this._shadowHost.parentNode||document.documentElement.appendChild(this._shadowHost)}_unmountWhenIdle(){!this._selectionActive&&!this._highlightTarget&&this._comments.size===0&&this._shadowHost.remove()}static _buildStyle(){const e=document.createElement("style");return e.textContent=`
			:host {
				all: initial;
				font-family: var(--pick-font, system-ui, -apple-system, sans-serif);
				pointer-events: none !important;
			}
			.highlight {
				position: absolute; box-sizing: border-box;
				z-index: 2;
			}
			.comment-backdrop {
				position: fixed;
				inset: 0;
				width: 100%;
				height: 100%;
				pointer-events: none;
				z-index: 2;
			}
			.comment-backdrop-fill {
				fill: var(--vscode-widget-shadow, transparent);
				opacity: 0;
				transition: opacity 120ms linear;
			}
			.comment-backdrop.visible .comment-backdrop-fill {
				opacity: 1;
			}
			.highlight-shape {
				fill: color-mix(in srgb, var(--vscode-focusBorder, #0078d4) 12%, transparent);
				stroke: var(--vscode-focusBorder, #0078d4);
				stroke-width: 2px;
			}
			.overlay {
				position: fixed; inset: 0;
				background: transparent; box-sizing: border-box;
				z-index: 2;
			}
			.comment-layer {
				position: absolute; inset: 0; pointer-events: none;
			}
			.comment-surface {
				position: fixed;
				box-sizing: border-box;
				width: min(320px, calc(100vw - 16px));
				border: var(--vscode-strokeThickness, 1px) solid var(--vscode-editorWidget-border, var(--vscode-contrastBorder, #454545));
				border-radius: var(--vscode-cornerRadius-large, 8px);
				background: var(--vscode-editorWidget-background, #252526);
				color: var(--vscode-editorWidget-foreground, #cccccc);
				box-shadow: 0 2px 6px var(--vscode-widget-shadow, transparent);
				font-size: 13px;
				font-weight: 400;
				z-index: 4;
			}
			.comment-surface[data-attachment-corner='top-left'] {
				border-top-left-radius: 0;
			}
			.comment-surface[data-attachment-corner='top-right'] {
				border-top-right-radius: 0;
			}
			.comment-surface[data-attachment-corner='bottom-left'] {
				border-bottom-left-radius: 0;
			}
			.comment-surface[data-attachment-corner='bottom-right'] {
				border-bottom-right-radius: 0;
			}
			.comment-preview-hit-area {
				position: fixed;
				pointer-events: none;
				z-index: 4;
			}
			.comment-preview {
				position: absolute;
				align-items: flex-start;
				gap: 8px;
				max-height: 96px;
				padding: 6px 8px;
				overflow: hidden;
				line-height: 20px;
				pointer-events: none;
			}
			.comment-preview.empty {
				gap: 0;
				padding: 4px;
			}
			.comment-preview.empty .comment-preview-body {
				display: none;
			}
			.comment-preview.empty .comment-preview-remove {
				margin-block: 0;
			}
			.comment-preview-body {
				flex: 1;
				min-width: 0;
				max-height: 82px;
				overflow-x: hidden;
				overflow-y: auto;
				overflow-wrap: anywhere;
				scrollbar-width: thin;
				white-space: pre-wrap;
			}
			:host(.comment-preview-active) .comment-preview-hit-area,
			:host(.comment-preview-active) .comment-preview {
				pointer-events: auto;
			}
			:host(.comment-preview-collapsing) .comment-preview-hit-area,
			:host(.comment-preview-collapsing) .comment-preview {
				pointer-events: none;
			}
			.comment-preview-remove {
				flex: none;
				display: grid;
				place-items: center;
				box-sizing: border-box;
				width: 24px;
				height: 24px;
				margin-block: -2px;
				padding: 0;
				border: 0;
				border-radius: var(--vscode-cornerRadius-small, 4px);
				background: transparent;
				color: var(--vscode-editorWidget-foreground, inherit);
				cursor: pointer;
				font-family: inherit;
			}
			.comment-preview-remove svg {
				display: block;
				width: var(--vscode-codiconFontSize, 16px);
				height: var(--vscode-codiconFontSize, 16px);
			}
			.comment-preview-remove:hover {
				background: var(--vscode-toolbar-hoverBackground, transparent);
			}
			.comment-composer {
				align-items: flex-end; gap: 6px; padding: 6px;
				pointer-events: auto;
			}
			.comment-input {
				flex: 1; min-width: 0; resize: none; overflow: auto;
				scrollbar-width: none;
				box-sizing: border-box; margin: 0; padding: 2px 6px;
				background: transparent; color: inherit;
				border: var(--vscode-strokeThickness, 1px) solid var(--vscode-editorWidget-border, var(--vscode-contrastBorder, #454545));
				border-radius: var(--vscode-cornerRadius-small, 4px);
				outline: 0;
				font: inherit;
				line-height: 20px;
				caret-color: var(--vscode-focusBorder, currentColor);
			}
			.comment-input::-webkit-scrollbar {
				display: none;
			}
			.comment-input::placeholder {
				color: var(--vscode-input-placeholderForeground, var(--vscode-descriptionForeground, #ccccccb3));
				opacity: 1;
			}
			.comment-send {
				box-sizing: border-box; border: 0; cursor: pointer; font-family: inherit;
			}
			.comment-send {
				flex: none; width: 24px; height: 24px; padding: 0;
				border-radius: var(--vscode-cornerRadius-small, 4px);
				background: transparent;
				color: var(--vscode-editorWidget-foreground, #cccccc);
				display: grid;
				place-items: center;
			}
			.comment-send svg {
				display: block;
				width: var(--vscode-codiconFontSize, 16px);
				height: var(--vscode-codiconFontSize, 16px);
			}
			.comment-send:hover {
				background: var(--vscode-toolbar-hoverBackground, transparent);
			}
			.comment-pin {
				position: absolute;
				display: grid;
				place-items: center;
				width: 22px;
				height: 22px;
				transform: translate(-11px, -11px);
				pointer-events: auto;
				z-index: 0;
				transition: opacity 120ms linear;
			}
			.comment-layer.composing .comment-pin {
				opacity: 0;
				pointer-events: none;
				z-index: auto;
			}
			.comment-layer.comment-capture-pending .comment-pin {
				visibility: hidden;
			}
			.comment-pin:hover, .comment-pin:focus-within {
				z-index: 1;
			}
			.comment-pin.previewing {
				z-index: 0;
			}
			:host(.comment-preview-active) .comment-pin:not(.previewing) {
				opacity: 0.35;
			}
			.comment-pin.previewing .comment-pin-bubble {
				width: 6px;
				height: 6px;
				border-width: 0;
			}
			.comment-pin.previewing .comment-pin-number {
				opacity: 0;
			}
			.comment-pin-bubble {
				box-sizing: border-box;
				display: grid;
				place-items: center;
				width: 22px;
				height: 22px;
				padding: 0;
				border: var(--vscode-strokeThickness, 1px) solid var(--vscode-editorWidget-background, #252526);
				border-radius: var(--vscode-cornerRadius-circle, 9999px);
				background: var(--vscode-button-background, #0078d4);
				color: var(--vscode-button-foreground, white);
				box-shadow: 0 2px 6px var(--vscode-widget-shadow, transparent);
				transition: width 140ms cubic-bezier(0.2, 0, 0, 1), height 140ms cubic-bezier(0.2, 0, 0, 1), border-width 140ms cubic-bezier(0.2, 0, 0, 1);
			}
			.comment-pin-number {
				display: block;
				width: 100%;
				font-size: 11px;
				font-weight: 600;
				line-height: 12px;
				text-align: center;
				transition: opacity 80ms linear;
			}
			.comment-send:focus-visible, .comment-preview-remove:focus-visible, .comment-pin:focus-visible, .comment-input:focus-visible {
				outline: 2px solid var(--vscode-focusBorder, #0078d4);
				outline-offset: 2px;
			}
			:host(.reduce-motion) .comment-backdrop-fill,
			:host(.reduce-motion) .comment-pin,
			:host(.reduce-motion) .comment-pin-bubble,
			:host(.reduce-motion) .comment-pin-number {
				transition: none;
			}
			.label {
				position: fixed; box-sizing: border-box;
				display: inline-flex; align-items: center; gap: 6px; height: 20px; padding: 0 6px;
				max-width: min(100%, 320px);
				background: var(--vscode-button-background, #0078d4);
				color: var(--vscode-button-foreground, white);
				font-family: inherit;
				font-size: 11px; line-height: 20px;
				white-space: nowrap;
				border-radius: 2px;
				box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
				z-index: 3;
			}
			.label-info {
				display: inline-block; overflow: hidden; text-overflow: ellipsis; min-width: 0;
			}
			.label-selector {
				font-weight: 600;
			}
			.label-dims {
				flex-shrink: 0; opacity: 0.8;
			}
			.dragbox {
				position: fixed; box-sizing: border-box;
				border: 1px dotted var(--vscode-focusBorder, #a0aabe);
				background: transparent;
				z-index: 2;
			}
		`,e}static _applyTheme(e,t){e.style.setProperty("--vscode-focusBorder",t?.focusBorder??null),e.style.setProperty("--vscode-button-background",t?.buttonBackground??null),e.style.setProperty("--vscode-button-foreground",t?.buttonForeground??null),e.style.setProperty("--vscode-editorWidget-background",t?.widgetBackground??null),e.style.setProperty("--vscode-editorWidget-foreground",t?.widgetForeground??null),e.style.setProperty("--vscode-editorWidget-border",t?.widgetBorder??null),e.style.setProperty("--vscode-widget-shadow",t?.widgetShadow??null),e.style.setProperty("--vscode-contrastBorder",t?.contrastBorder??null),e.style.setProperty("--vscode-descriptionForeground",t?.descriptionForeground??null),e.style.setProperty("--vscode-input-placeholderForeground",t?.inputPlaceholderForeground??null),e.style.setProperty("--vscode-toolbar-hoverBackground",t?.toolbarHoverBackground??null),e.style.setProperty("--pick-font",t?.font??null)}}class T{constructor(e,t){this._onPicked=e;this._onStopped=t;this._selectionActive=!1;this._onPointerDown=e=>{!this._selectionActive||e.button!==0||(this._dragStart={x:e.clientX,y:e.clientY},this._dragbox.style.display="block",this._dragbox.style.left=`${e.clientX}px`,this._dragbox.style.top=`${e.clientY}px`,this._dragbox.style.width="0px",this._dragbox.style.height="0px",e.preventDefault(),e.stopPropagation())};this._onPointerMove=e=>{if(!this._selectionActive||!this._dragStart)return;e.preventDefault(),e.stopPropagation();const t=Math.min(this._dragStart.x,e.clientX),n=Math.min(this._dragStart.y,e.clientY),i=Math.abs(e.clientX-this._dragStart.x),s=Math.abs(e.clientY-this._dragStart.y);this._dragbox.style.left=`${t}px`,this._dragbox.style.top=`${n}px`,this._dragbox.style.width=`${i}px`,this._dragbox.style.height=`${s}px`};this._onPointerUp=e=>{if(!this._selectionActive||!this._dragStart)return;const t=this._dragStart,n=Math.min(t.x,e.clientX),i=Math.min(t.y,e.clientY),s=Math.abs(e.clientX-t.x),r=Math.abs(e.clientY-t.y);if(this._teardown(),e.preventDefault(),e.stopPropagation(),s<T._MIN_AREA_PX||r<T._MIN_AREA_PX){this._onStopped();return}const a=window.visualViewport,m=a?.offsetLeft??0,l=a?.offsetTop??0,d={x:n-m,y:i-l,width:s,height:r};this._onPicked(d)};this._onClick=e=>{this._selectionActive&&(e.preventDefault(),e.stopPropagation())};this._onKeyDown=e=>{this._selectionActive&&e.key==="Escape"&&(this.stop(),e.preventDefault(),e.stopPropagation())};const n=document.createElement("div");n.setAttribute("data-vscode-area-pick-host",""),n.style.cssText="position: absolute; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647; pointer-events: none;";const i=n.attachShadow({mode:"closed"});i.appendChild(T._buildStyle()),this._shadowHost=n;const s=document.createElement("div");s.className="overlay",i.appendChild(s);const r=document.createElement("div");r.className="dragbox",r.style.display="none",i.appendChild(r),this._dragbox=r}static{this._MIN_AREA_PX=4}static{this._CURSOR_CROSSHAIR="/* VS Code injected style */ * { cursor: crosshair !important; }"}start(){if(this._selectionActive)return;this._dragStart=void 0,document.documentElement.appendChild(this._shadowHost),this._selectionActive=!0;const e=document.createElement("style");e.setAttribute("data-vscode-area-pick-cursor",""),e.textContent=T._CURSOR_CROSSHAIR,document.head.appendChild(e),this._cursorStylesheet=e,window.addEventListener("pointermove",this._onPointerMove,!0),window.addEventListener("pointerdown",this._onPointerDown,!0),window.addEventListener("pointerup",this._onPointerUp,!0),window.addEventListener("click",this._onClick,!0),window.addEventListener("contextmenu",this._onClick,!0),window.addEventListener("keydown",this._onKeyDown,!0)}stop(){this._selectionActive&&(this._teardown(),this._onStopped())}_teardown(){this._selectionActive=!1,this._shadowHost.remove(),this._cursorStylesheet?.remove(),this._cursorStylesheet=void 0,window.removeEventListener("pointermove",this._onPointerMove,!0),window.removeEventListener("pointerdown",this._onPointerDown,!0),window.removeEventListener("pointerup",this._onPointerUp,!0),window.removeEventListener("click",this._onClick,!0),window.removeEventListener("contextmenu",this._onClick,!0),window.removeEventListener("keydown",this._onKeyDown,!0),this._dragbox.style.display="none",this._dragbox.style.left="0px",this._dragbox.style.top="0px",this._dragbox.style.width="0px",this._dragbox.style.height="0px",this._dragStart=void 0}setTheme(e){this._shadowHost.style.setProperty("--vscode-focusBorder",e?.focusBorder??null)}static _buildStyle(){const e=document.createElement("style");return e.textContent=`
			:host {
				all: initial;
				pointer-events: none !important;
			}
			.overlay {
				position: fixed; inset: 0;
				background: transparent;
				z-index: 1;
				/* Capture hit-testing so pointer events don't reach the underlying
				 * page during a pick \u2014 otherwise hover/:hover styles would
				 * fire on elements beneath the cursor while we're dragging. */
				pointer-events: auto;
			}
			.dragbox {
				position: fixed; box-sizing: border-box;
				border: 1px dashed var(--vscode-focusBorder, #0078d4);
				background: color-mix(in srgb, var(--vscode-focusBorder, #0078d4) 12%, transparent);
				z-index: 2;
				pointer-events: auto;
			}
		`,e}}F();
//# sourceMappingURL=preload-browserView.js.map
