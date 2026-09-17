/*!--------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
"use strict";(function(){const{ipcRenderer:n,webFrame:t,contextBridge:i}=require("electron");function o(e){if(!e?.startsWith("vscode:"))throw new Error(`Unsupported event IPC channel '${e}'`);return!0}const s={ipcRenderer:{send(e,...r){o(e)&&n.send(e,...r)},invoke(e,...r){return o(e),n.invoke(e,...r)}},webFrame:{setZoomLevel(e){typeof e=="number"&&t.setZoomLevel(e)}}};try{i.exposeInMainWorld("vscode",s)}catch(e){console.error(e)}})();
//# sourceMappingURL=preload-aux.js.map
