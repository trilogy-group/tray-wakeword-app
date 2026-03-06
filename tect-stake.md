# Tech Stack Decision

## Framework: Electron

Electron was chosen as the most pragmatic cross-platform desktop framework for this project.

**Why Electron:**
- Mature tray icon and context menu support out of the box
- Packaging to native installers (.exe, .dmg, .deb, .AppImage) via electron-builder
- Porcupine wake word engine has actively maintained Node.js bindings (v4.0.2)
- Same technology behind VS Code, Slack, and Discord
- Fastest path to a working cross-platform prototype

**Alternatives considered:**
- **Python + pystray + tkinter** -- simplest code, but not a truly native binary; PyInstaller output is large and slow to start
- **Tauri (Rust)** -- smaller binaries, but the Porcupine Rust crate (`pv_porcupine`) was yanked from crates.io; no maintained wake word bindings available
- **Qt / Flutter** -- overkill for this scope; much heavier setup
- **openWakeWord** -- no pre-trained model for custom phrases; training pipeline too complex for a simple app

## Wake Word: Picovoice Porcupine

- `@picovoice/porcupine-node` v4.0.2
- Custom wake word "hello trilogy" trained in seconds via web console
- Detection runs 100% offline on-device (no cloud calls)
- Free tier: no credit card, just email/GitHub/Google sign-up
- Paired with `@picovoice/pvrecorder-node` for mic capture

## Packaging: electron-builder

- Windows: NSIS installer (.exe)
- macOS: DMG (.dmg)
- Linux: AppImage + .deb
