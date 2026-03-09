import os
import threading
import urllib.request
from PySide6.QtCore import Signal, QObject

from .config import MODEL_BASE_URL, REQUIRED_MODELS, get_models_dir


def download_model(filename, target_dir, progress_cb=None):
    url = f"{MODEL_BASE_URL}/{filename}"
    dest = os.path.join(target_dir, filename)
    if os.path.isfile(dest):
        return

    print(f"Downloading {filename}...")
    req = urllib.request.Request(url, headers={"User-Agent": "JarvisWakeWord/1.0"})
    resp = urllib.request.urlopen(req, timeout=60)
    total = int(resp.headers.get("Content-Length", 0))
    downloaded = 0
    chunk_size = 64 * 1024

    tmp = dest + ".tmp"
    with open(tmp, "wb") as f:
        while True:
            chunk = resp.read(chunk_size)
            if not chunk:
                break
            f.write(chunk)
            downloaded += len(chunk)
            if progress_cb and total > 0:
                progress_cb(filename, downloaded, total)

    os.replace(tmp, dest)
    print(f"  Saved {filename} ({downloaded:,} bytes)")


class DownloadSignal(QObject):
    progress = Signal(str, int, int)
    finished = Signal(bool, str)


class DownloadThread(threading.Thread):
    def __init__(self, signal: DownloadSignal):
        super().__init__(daemon=True)
        self.signal = signal

    def run(self):
        target = get_models_dir()
        try:
            for fname in REQUIRED_MODELS:
                download_model(
                    fname,
                    target,
                    progress_cb=lambda name, done, total: self.signal.progress.emit(
                        name, done, total
                    ),
                )
            self.signal.finished.emit(True, "")
        except Exception as e:
            self.signal.finished.emit(False, str(e))
