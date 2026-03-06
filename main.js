const { app, BrowserWindow, Tray, Menu, nativeImage } = require("electron");
const path = require("path");
const fs = require("fs");

let tray = null;
let mainWindow = null;
let wakeWordListener = null;

function getLogFile() {
  if (!app.isPackaged) return path.join(__dirname, "wakeword-debug.log");
  try {
    return path.join(app.getPath("userData"), "wakeword-debug.log");
  } catch {
    return path.join(path.dirname(process.execPath), "wakeword-debug.log");
  }
}
function debugLog(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync(getLogFile(), line); } catch {}
  console.log(msg);
}

function getAssetPath(filename) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, filename);
  }
  return path.join(__dirname, filename);
}

function getPlatformTag() {
  const tags = { win32: "windows", linux: "linux", darwin: "mac" };
  return tags[process.platform] || process.platform;
}

function getModelPath() {
  const modelsDir = app.isPackaged
    ? path.join(process.resourcesPath, "models")
    : path.join(__dirname, "models");

  const files = fs.existsSync(modelsDir)
    ? fs.readdirSync(modelsDir).filter((f) => f.endsWith(".ppn"))
    : [];

  if (files.length === 0) return null;

  const platformTag = getPlatformTag();
  const platformModel = files.find((f) => f.includes(platformTag));

  if (!platformModel) {
    console.log(`Platform: ${process.platform} -> tag: ${platformTag}, no matching .ppn found`);
    return null;
  }

  console.log(`Platform: ${process.platform} -> tag: ${platformTag}, model: ${platformModel}`);
  return path.join(modelsDir, platformModel);
}

function loadAccessKey() {
  const envPath = app.isPackaged
    ? path.join(process.resourcesPath, ".env")
    : path.join(__dirname, ".env");

  console.log(`Looking for .env at: ${envPath} (exists: ${fs.existsSync(envPath)})`);

  if (!fs.existsSync(envPath)) return null;

  const content = fs.readFileSync(envPath, "utf-8");
  const match = content.match(/PORCUPINE_ACCESS_KEY=(.+)/);
  return match ? match[1].trim() : null;
}

function createWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 500,
    height: 500,
    resizable: false,
    show: false,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile("index.html");

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on("close", (e) => {
    e.preventDefault();
    mainWindow.hide();
  });
}

function showWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
  } else {
    createWindow();
  }
}

function createTray() {
  const iconPath = getAssetPath(path.join("assets", "icon.png"));
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Window",
      click: () => showWindow(),
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        stopWakeWordListener();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.removeAllListeners("close");
          mainWindow.close();
        }
        tray.destroy();
        app.quit();
      },
    },
  ]);

  tray.setToolTip("WakeWord App - mic not active");
  tray.setContextMenu(contextMenu);
}

function updateTrayTooltip(keyword) {
  if (tray && !tray.isDestroyed()) {
    tray.setToolTip(keyword
      ? `WakeWord App - listening for '${keyword}'`
      : "WakeWord App - mic not active");
  }
}

async function startWakeWordListener() {
  const accessKey = loadAccessKey();
  const modelPath = getModelPath();

  if (!accessKey) {
    console.log(
      "No PORCUPINE_ACCESS_KEY found in .env file. Wake word detection disabled.\n" +
        "Get a free key at https://console.picovoice.ai/"
    );
    return;
  }

  if (!modelPath) {
    console.log(
      "No .ppn model for this platform in models/ directory. Falling back to built-in keyword."
    );
  }

  try {
    debugLog(`app.isPackaged: ${app.isPackaged}`);
    debugLog(`__dirname: ${__dirname}`);
    debugLog(`process.resourcesPath: ${process.resourcesPath}`);

    const { Porcupine, BuiltinKeyword, getBuiltinKeywordPath } = require("@picovoice/porcupine-node");
    debugLog("require @picovoice/porcupine-node OK");
    const { PvRecorder } = require("@picovoice/pvrecorder-node");
    debugLog("require @picovoice/pvrecorder-node OK");

    const FALLBACK_KEYWORD = "COMPUTER";
    let porcupine;
    let activeKeyword;

    const porcupineOptions = {};
    if (app.isPackaged) {
      const porcupineDir = path.dirname(require.resolve("@picovoice/porcupine-node/package.json"));
      const pvModelFile = path.join(porcupineDir, "lib", "common", "porcupine_params.pv");
      porcupineOptions.modelPath = pvModelFile.replace("app.asar", "app.asar.unpacked");
      debugLog(`Porcupine internal model path (unpacked): ${porcupineOptions.modelPath}`);
    }

    if (modelPath) {
      debugLog(`Initializing Porcupine with custom model: ${modelPath}`);
      debugLog(`Model file exists: ${fs.existsSync(modelPath)}`);
      porcupine = new Porcupine(accessKey, [modelPath], [0.5], porcupineOptions);
      activeKeyword = "hello trilogy";
    } else {
      debugLog(`No .ppn model for this platform, using built-in keyword: ${FALLBACK_KEYWORD}`);
      let builtinPath = getBuiltinKeywordPath(BuiltinKeyword[FALLBACK_KEYWORD]);
      if (app.isPackaged) {
        builtinPath = builtinPath.replace("app.asar", "app.asar.unpacked");
      }
      debugLog(`Built-in keyword path: ${builtinPath} (exists: ${fs.existsSync(builtinPath)})`);
      porcupine = new Porcupine(accessKey, [builtinPath], [0.5], porcupineOptions);
      activeKeyword = FALLBACK_KEYWORD.toLowerCase();
    }
    debugLog(`Porcupine initialized successfully (keyword: "${activeKeyword}")`);

    const devices = PvRecorder.getAvailableDevices();
    debugLog(`Available audio devices: ${devices.join(", ")}`);

    const recorder = new PvRecorder(porcupine.frameLength);
    recorder.start();

    debugLog(`Listening for wake word "${activeKeyword}"...`);
    updateTrayTooltip(activeKeyword);

    let running = true;

    const listen = async () => {
      while (running) {
        const frame = await recorder.read();
        const index = porcupine.process(frame);
        if (index >= 0) {
          debugLog("Wake word detected!");
          showWindow();
        }
      }
    };

    listen().catch((err) => debugLog(`Wake word listener error: ${err.message}\n${err.stack}`));

    wakeWordListener = {
      stop: () => {
        running = false;
        recorder.stop();
        recorder.release();
        porcupine.release();
        debugLog("Wake word listener stopped.");
      },
    };
  } catch (err) {
    debugLog(`FAILED to start wake word listener: ${err.message}`);
    debugLog(`Full error: ${err.stack || err}`);
    if (process.platform === "darwin") {
      debugLog("On macOS, check System Settings > Privacy & Security > Microphone and ensure the app is allowed.");
    }
    debugLog(`See log file for details: ${getLogFile()}`);
    updateTrayTooltip(null);
  }
}

function stopWakeWordListener() {
  if (wakeWordListener) {
    wakeWordListener.stop();
    wakeWordListener = null;
  }
}

app.on("window-all-closed", () => {
  // Keep running in tray when all windows are closed
});

app.whenReady().then(() => {
  createTray();
  startWakeWordListener();
  console.log("App running in system tray. Right-click the tray icon for options.");
});

app.on("before-quit", () => {
  stopWakeWordListener();
});
