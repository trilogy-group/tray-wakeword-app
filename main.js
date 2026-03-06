const { app, BrowserWindow, Tray, Menu, nativeImage } = require("electron");
const path = require("path");
const fs = require("fs");

let tray = null;
let mainWindow = null;
let wakeWordListener = null;

function getAssetPath(filename) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, filename);
  }
  return path.join(__dirname, filename);
}

function getModelPath() {
  const modelsDir = app.isPackaged
    ? path.join(process.resourcesPath, "models")
    : path.join(__dirname, "models");

  const files = fs.existsSync(modelsDir)
    ? fs.readdirSync(modelsDir).filter((f) => f.endsWith(".ppn"))
    : [];

  if (files.length === 0) return null;
  return path.join(modelsDir, files[0]);
}

function loadAccessKey() {
  const envPath = path.join(__dirname, ".env");
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

  tray.setToolTip("WakeWord App");
  tray.setContextMenu(contextMenu);
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
      "No .ppn model file found in models/ directory. Wake word detection disabled.\n" +
        "Train your wake word at https://console.picovoice.ai/"
    );
    return;
  }

  try {
    const { Porcupine } = require("@picovoice/porcupine-node");
    const { PvRecorder } = require("@picovoice/pvrecorder-node");

    const porcupine = new Porcupine(accessKey, [modelPath], [0.5]);

    const recorder = new PvRecorder(porcupine.frameLength);
    recorder.start();

    console.log(`Listening for wake word (model: ${path.basename(modelPath)})...`);

    let running = true;

    const listen = async () => {
      while (running) {
        const frame = await recorder.read();
        const index = porcupine.process(frame);
        if (index >= 0) {
          console.log("Wake word detected!");
          showWindow();
        }
      }
    };

    listen().catch((err) => console.error("Wake word listener error:", err));

    wakeWordListener = {
      stop: () => {
        running = false;
        recorder.stop();
        recorder.release();
        porcupine.release();
        console.log("Wake word listener stopped.");
      },
    };
  } catch (err) {
    console.error("Failed to start wake word listener:", err.message);
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
