# Tray Wake Word Desktop App - Build Plan

## Tech Stack

- **Framework**: Electron -- mature, cross-platform desktop framework. Same tech behind VS Code, Slack, Discord. Trivial tray support, easy packaging, huge ecosystem
- **Wake Word Engine**: `@picovoice/porcupine-node` v4.0.2 -- lightweight, offline wake word detection. Custom wake words trained in seconds via Picovoice Console. Runs 100% on-device
- **Audio Capture**: `@picovoice/pvrecorder-node` v1.2.8 -- cross-platform mic capture, designed to pair with Porcupine
- **Wake Word Phrase**: **"hello trilogy"** -- custom `.ppn` model file trained via Picovoice Console
- **Packaging**: `electron-builder` -- produces native installers: `.exe`/NSIS (Windows), `.dmg` (Mac), `.deb`/`.AppImage` (Linux)
- **Config**: `dotenv` -- loads Porcupine access key from `.env` file

## One-Time Setup (before running)

1. Sign up at https://console.picovoice.ai/ (free, no credit card)
2. Copy the **AccessKey** from the console
3. Go to Porcupine wake word trainer, type "hello trilogy", select platforms, train, download the `.ppn` file
4. Place the `.ppn` file in the project's `models/` folder
5. Create `.env` with the access key

## Architecture

```
main.js (Electron Main Process)
    |
    +-- System Tray Icon
    |     |
    |     +-- Right-click menu: "Open Window" / "Quit"
    |
    +-- Wake Word Listener (Porcupine + PvRecorder)
    |     |
    |     +-- On "hello trilogy" detected --> show window
    |
    +-- BrowserWindow Manager
          |
          +-- 500x500 window showing index.html ("Hello World")
          +-- Close button hides window (app stays in tray)
```

- **Main process** (`main.js`): creates the tray icon, manages the window, runs the Porcupine wake word listener
- **Renderer** (`index.html`): simple HTML page showing "Hello World" in the 500x500 window
- Tray icon shows a **right-click context menu** (like Cursor's tray menu) with "Open Window" and "Quit"
- Closing the window hides it (app stays in tray). "Quit" kills everything.

## File Structure (~5 core files)

```
tray-wakeword-app/
  package.json           # dependencies + electron-builder config
  main.js                # Electron main process (tray, window, wake word)
  preload.js             # secure bridge between main and renderer
  index.html             # "Hello World" UI
  assets/
    icon.png             # tray icon (16x16 or 32x32 PNG)
  models/
    (hello-trilogy.ppn)  # Porcupine wake word model (user downloads from console)
  .env.example           # template: PORCUPINE_ACCESS_KEY=your_key_here
  tect-stake.md          # tech stack documentation
  README.md              # setup + run + build instructions
```

## Key Behaviors

1. App starts minimized to system tray (no window on launch)
2. Right-click tray icon shows context menu: "Open Window", "Quit"
3. "Open Window" shows a centered 500x500 window with "Hello World"
4. Closing the window (X button) hides it back to tray
5. Wake word "hello trilogy" opens the window automatically
6. "Quit" stops wake word listener, destroys tray, exits process
7. Wake word listener runs continuously in background while app is alive

## Packaging

electron-builder config in `package.json` produces:
- **Windows**: NSIS installer (.exe)
- **macOS**: DMG (.dmg)
- **Linux**: AppImage + .deb

Build command: `npm run build` (must build on each target OS)

## Why Electron over alternatives

| Considered | Verdict |
|---|---|
| Python + pystray + tkinter | Simplest code but not truly native binary; PyInstaller bundles are large and slow to start |
| Tauri (Rust) | Smaller binaries, but Porcupine Rust crate was yanked from crates.io -- no maintained wake word bindings |
| Qt / Flutter | Overkill setup for this scope |
| **Electron** | **Chosen** -- mature tray support, Porcupine Node.js bindings actively maintained (v4.0.2), trivial packaging with electron-builder, same tech as VS Code/Slack/Discord |
