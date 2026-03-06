const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("appInfo", {
  name: "WakeWord App",
  version: "1.0.0",
});
