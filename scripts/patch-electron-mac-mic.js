#!/usr/bin/env node
/**
 * macOS only: patch Electron's Info.plist to add NSMicrophoneUsageDescription
 * so the wake word listener can use the mic (dev and built app need this on Mac).
 *
 * Windows and Linux: exits immediately with code 0. No files are read or
 * modified. npm install and builds on Windows/Linux behave exactly as before.
 */
const fs = require("fs");
const path = require("path");

if (process.platform !== "darwin") {
  process.exit(0); // Windows + Linux: do nothing, keep existing behavior
}

const electronPlistPath = path.join(
  __dirname,
  "..",
  "node_modules",
  "electron",
  "dist",
  "Electron.app",
  "Contents",
  "Info.plist"
);

if (!fs.existsSync(electronPlistPath)) {
  console.log("patch-electron-mac-mic: Electron.app not found, skipping.");
  process.exit(0);
}

const desc = "This app needs microphone access to listen for the wake word.";
let plist = fs.readFileSync(electronPlistPath, "utf8");

if (plist.includes("NSMicrophoneUsageDescription")) {
  console.log("patch-electron-mac-mic: NSMicrophoneUsageDescription already present.");
  process.exit(0);
}

// Insert before </dict> so the key is inside the root dict
const key = `  <key>NSMicrophoneUsageDescription</key>\n  <string>${desc}</string>\n`;
const lastDict = plist.lastIndexOf("</dict>");
if (lastDict === -1) {
  console.warn("patch-electron-mac-mic: Could not find </dict> in Info.plist");
  process.exit(1);
}
plist = plist.slice(0, lastDict) + key + plist.slice(lastDict);
fs.writeFileSync(electronPlistPath, plist);
console.log("patch-electron-mac-mic: Added NSMicrophoneUsageDescription to Electron.app for dev.");
process.exit(0);
