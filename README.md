# WakeWord Tray App

A cross-platform desktop application that lives in the system tray and listens for an offline wake word. When the wake word **"hello trilogy"** is detected (or the user clicks "Open Window" from the tray menu), a 500x500 window opens displaying "Hello World".

Built with Electron + Picovoice Porcupine.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- A free [Picovoice Console](https://console.picovoice.ai/) account

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Get your Picovoice access key

1. Sign up at [console.picovoice.ai](https://console.picovoice.ai/) (free, no credit card)
2. Copy your **AccessKey** from the dashboard

### 3. Train the "hello trilogy" wake word

1. In the Picovoice Console, go to **Porcupine**
2. Type **hello trilogy** as the wake word
3. Select your target platform(s): Windows, macOS, Linux
4. Click **Train** (takes a few seconds)
5. Download the `.ppn` file

### 4. Configure the app

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Paste your access key into `.env`:
   ```
   PORCUPINE_ACCESS_KEY=your_actual_key_here
   ```
3. Place the downloaded `.ppn` file into the `models/` folder

## Run

```bash
npm start
```

The app starts minimized to the system tray (no window on launch).

### Usage

- **Right-click** the tray icon to see the context menu
- Click **"Open Window"** to show the Hello World window
- Click **"Quit"** to exit the app
- **Say "hello trilogy"** to open the window via voice

Closing the window (X button) hides it back to the tray -- the app keeps running.

## Build installers

Build a native installer for your current platform:

```bash
npm run build
```

Or target a specific platform:

```bash
npm run build:win    # Windows (.exe installer)
npm run build:mac    # macOS (.dmg)
npm run build:linux  # Linux (.AppImage + .deb)
```

> Note: You must build on the target OS (e.g., build Windows installer on Windows).

Output goes to the `dist/` folder.

### Upload Mac zip to GitHub release (v1.0.0)

To build the Mac zip (with mic permission) and upload it to [v1.0.0](https://github.com/trilogy-group/tray-wakeword-app/releases/tag/v1.0.0):

1. Ensure you have a `.env` with `PORCUPINE_ACCESS_KEY` (and `models/` with your `.ppn` if needed).
2. Install [GitHub CLI](https://cli.github.com/) and run `gh auth login` for the `trilogy-group/tray-wakeword-app` repo.
3. From the repo root:
   ```bash
   chmod +x scripts/upload-release-mac.sh
   npm run release:mac
   ```
   Or manually:
   ```bash
   npm run build:mac
   gh release upload v1.0.0 "dist/"*.zip --clobber
   ```

## Project structure

```
tray-wakeword-app/
  main.js          # Electron main process: tray, window, wake word listener
  preload.js       # Secure bridge between main and renderer
  index.html       # "Hello World" UI
  package.json     # Dependencies + electron-builder config
  assets/
    icon.png       # Tray icon
  models/
    *.ppn          # Porcupine wake word model (you provide this)
  .env             # Your Porcupine access key (not committed)
  .env.example     # Template for .env
```

## Platforms (Windows, macOS, Linux)

The same code and build process work on all three. The `postinstall` script only runs on **macOS** (to allow microphone access there); on **Windows** and **Linux** it does nothing, so behavior is unchanged from before.

## Troubleshooting

- **"No PORCUPINE_ACCESS_KEY found"** -- Create a `.env` file with your key (see Setup step 4)
- **"No .ppn model file found"** -- Place your trained `.ppn` file in the `models/` folder
- **Wake word not detecting** -- Speak clearly and at normal volume. Try adjusting sensitivity in `main.js` (the `0.5` value in the Porcupine constructor)
- **Tray icon not visible** -- On Linux, you may need a system tray extension (e.g., AppIndicator for GNOME)
