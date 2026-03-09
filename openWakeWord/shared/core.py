import os
import threading
import numpy as np
import sounddevice as sd
from PySide6.QtCore import Signal, QObject

from .config import (
    WAKE_WORD,
    DETECTION_THRESHOLD,
    AUDIO_RATE,
    AUDIO_CHUNK,
    get_models_dir,
)


class WakeWordSignal(QObject):
    detected = Signal()


class WakeWordListener(threading.Thread):
    def __init__(self, signal: WakeWordSignal):
        super().__init__(daemon=True)
        self.signal = signal
        self._running = True

    def run(self):
        models_dir = get_models_dir()
        wakeword_path = os.path.join(models_dir, "hey_jarvis_v0.1.onnx")
        melspec_path = os.path.join(models_dir, "melspectrogram.onnx")
        embedding_path = os.path.join(models_dir, "embedding_model.onnx")

        if not os.path.isfile(wakeword_path):
            print(f"FATAL: Wake word model not found at {wakeword_path}")
            return

        try:
            from openwakeword.model import Model

            model = Model(
                wakeword_models=[wakeword_path],
                inference_framework="onnx",
                melspec_model_path=melspec_path,
                embedding_model_path=embedding_path,
            )
        except Exception as e:
            print(f"FATAL: Failed to load wake word model: {e}")
            import traceback

            traceback.print_exc()
            return

        print(f'Listening for wake word "{WAKE_WORD}"...')

        def audio_callback(indata, frames, time_info, status):
            if not self._running:
                return
            audio = np.frombuffer(indata, dtype=np.int16).flatten()
            prediction = model.predict(audio)
            for mdl_name, score in prediction.items():
                if score >= DETECTION_THRESHOLD:
                    print(f"Wake word detected! ({mdl_name}: {score:.4f})")
                    self.signal.detected.emit()

        try:
            print(f"Opening microphone (rate={AUDIO_RATE}, chunk={AUDIO_CHUNK})...")
            with sd.InputStream(
                samplerate=AUDIO_RATE,
                channels=1,
                dtype="int16",
                blocksize=AUDIO_CHUNK,
                callback=audio_callback,
            ):
                print("Microphone opened successfully.")
                while self._running:
                    sd.sleep(100)
        except Exception as e:
            print(f"Audio error: {e}")
            import traceback

            traceback.print_exc()

    def stop(self):
        self._running = False
