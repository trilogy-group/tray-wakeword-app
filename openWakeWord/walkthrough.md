# WakeWord Tray App (PySide6 + openWakeWord)

A cross-platform system tray app that listens for the wake word **"hey jarvis"** offline. When detected, a 500x500 "Hello World" window opens. No API key, no account, fully free and open source.

## Prerequisites

- Python 3.10 or newer
- pip
- A working microphone
- **Linux only**: `portaudio` dev library (for PyAudio)
- **Windows only**: PyAudio ships with pre-built binaries, no extra setup

## Setup

### 1. Create a virtual environment (recommended)

```bash
cd openWakeWord

# Create venv
python -m venv venv

# Activate it
# Windows (PowerShell):
.\venv\Scripts\Activate

# Windows (CMD):
venv\Scripts\activate.bat

# macOS / Linux:
source venv/bin/activate
```

### 2. Install system dependencies (Linux only)

```bash
sudo apt update
sudo apt install portaudio19-dev python3-pyaudio
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

> **Linux (Python 3.12+):** If `tflite-runtime` fails to install, use the ONNX-only approach:
> ```bash
> pip install openwakeword --no-deps
> pip install onnxruntime scipy scikit-learn tqdm requests numpy sounddevice PySide6
> ```

### 4. Download and bundle wake word models

On first run, openWakeWord downloads the "hey jarvis" model (~a few MB). For a self-contained build, pre-download them:

```bash
python -c "import openwakeword; openwakeword.utils.download_models()"
```

Then copy the ONNX models into the project:

```bash
mkdir -p models
# Find your site-packages path:
python -c "import openwakeword; print(openwakeword.__file__)"
# Copy .onnx files from that package's resources/models/ directory:
cp $(python -c "import openwakeword, os; print(os.path.join(os.path.dirname(openwakeword.__file__), 'resources', 'models'))")/*.onnx models/
```

If the `models/` directory exists, the app uses bundled models with no internet needed. Otherwise it falls back to downloading.

## Run

```bash
python main.py
```

The app starts minimized to the system tray.

### Usage

- **Right-click** the tray icon for the context menu
- Click **"Open Window"** to show the Hello World window
- Click **"Quit"** to exit
- **Say "hey jarvis"** to open the window via voice
- Closing the window (X) hides it back to the tray -- the app keeps running

### Troubleshooting audio on Linux

If you get a PyAudio error:

```bash
sudo apt install portaudio19-dev
pip install pyaudio
```

On some Linux desktops (e.g. GNOME), you may need a system tray extension (AppIndicator) for the tray icon to show.

## Build standalone executables

Use PyInstaller to create a single-file executable for your platform:

### Install PyInstaller

```bash
pip install pyinstaller
```

### Build

```bash
# Windows (use ; separator)
pyinstaller --onefile --windowed --add-data "assets;assets" --add-data "models;models" --name JarvisWakeWord main.py

# macOS / Linux (use : separator)
pyinstaller --onefile --windowed --add-data "assets:assets" --add-data "models:models" --name JarvisWakeWord main.py
```

The executable will be at:

```
dist/JarvisWakeWord        # Linux / macOS
dist/JarvisWakeWord.exe    # Windows
```

### Run the built executable

```bash
# Linux / macOS
chmod +x dist/JarvisWakeWord
./dist/JarvisWakeWord

# Windows
dist\JarvisWakeWord.exe
```

## Project structure

```
openWakeWord/
  main.py              # App: tray, window, wake word listener (all Python)
  requirements.txt     # Python dependencies
  assets/
    icon.png           # Tray icon
  models/              # Pre-downloaded ONNX models (bundled into executable)
    hey_jarvis_v0.1.onnx
    melspectrogram.onnx
    embedding_model.onnx
  walkthrough.md       # This file
```

## How it works

1. **PySide6** creates the system tray icon with a context menu and the "Hello World" window
2. **openWakeWord** loads the pre-trained "hey jarvis" ONNX model (bundled in `models/`, or downloaded on first run as fallback)
3. **PyAudio** captures microphone audio in 80ms chunks (1280 samples at 16kHz)
4. A background thread feeds audio to openWakeWord's `model.predict()`
5. When a prediction score exceeds the threshold (0.5), a Qt signal is emitted
6. The main thread receives the signal and shows the window

## Comparison with Electron + Picovoice version

| | Electron + Picovoice | PySide6 + openWakeWord |
|---|---|---|
| Language | JavaScript (Node.js) | Python |
| API key | Required (Picovoice) | Not needed |
| Device limit | 1 per key (free tier) | Unlimited |
| Custom wake word | Type in web console | Train via Google Colab (~1 hr) |
| Default wake word | "computer" (built-in) | "hey jarvis" (pre-trained) |
| App framework | Electron | PySide6 (Qt) |
| Packaging | electron-builder | PyInstaller |
| Cost | Free tier limited | Fully free (Apache-2.0) |
