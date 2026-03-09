import sys
import os

APP_NAME = "JarvisWakeWord"
WAKE_WORD = "hey_jarvis"
DETECTION_THRESHOLD = 0.5
AUDIO_RATE = 16000
AUDIO_CHUNK = 1280

MODEL_BASE_URL = "https://github.com/dscripka/openWakeWord/releases/download/v0.5.1"
REQUIRED_MODELS = [
    "embedding_model.onnx",
    "melspectrogram.onnx",
    "hey_jarvis_v0.1.onnx",
]

IS_WINDOWS = sys.platform == "win32"
IS_LINUX = sys.platform.startswith("linux")


def resource_path(relative):
    """Resolve path for both dev and PyInstaller-bundled app."""
    if hasattr(sys, "_MEIPASS"):
        return os.path.join(sys._MEIPASS, relative)
    return os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), relative
    )


def get_models_dir():
    """Platform-aware persistent directory for downloaded models."""
    if IS_WINDOWS:
        base = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
    else:
        base = os.environ.get(
            "XDG_DATA_HOME", os.path.join(os.path.expanduser("~"), ".local", "share")
        )
    d = os.path.join(base, APP_NAME, "models")
    os.makedirs(d, exist_ok=True)
    return d


def models_ready():
    d = get_models_dir()
    return all(os.path.isfile(os.path.join(d, m)) for m in REQUIRED_MODELS)


def platform_font(win_family, linux_family):
    return win_family if IS_WINDOWS else linux_family
