import sys
import os
from PySide6.QtWidgets import (
    QApplication,
    QMainWindow,
    QLabel,
    QSystemTrayIcon,
    QMenu,
    QVBoxLayout,
    QWidget,
)
from PySide6.QtGui import QIcon, QAction, QFont
from PySide6.QtCore import Qt, QTimer

from .config import resource_path, models_ready, platform_font
from .core import WakeWordSignal, WakeWordListener
from .download import DownloadSignal, DownloadThread


class HelloWorldWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("WakeWord App")
        self.setFixedSize(500, 500)

        central = QWidget()
        self.setCentralWidget(central)
        layout = QVBoxLayout(central)
        layout.setAlignment(Qt.AlignCenter)

        icon_label = QLabel("\U0001f399\ufe0f")
        icon_label.setFont(
            QFont(platform_font("Segoe UI Emoji", "Noto Color Emoji"), 48)
        )
        icon_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(icon_label)

        title = QLabel("Hello World")
        title.setFont(QFont(platform_font("Segoe UI", "Sans"), 36, QFont.Light))
        title.setStyleSheet("color: #f8fafc;")
        title.setAlignment(Qt.AlignCenter)
        layout.addWidget(title)

        subtitle = QLabel("Say the wake word to activate")
        subtitle.setFont(QFont(platform_font("Segoe UI", "Sans"), 11))
        subtitle.setStyleSheet("color: #94a3b8; margin-top: 8px;")
        subtitle.setAlignment(Qt.AlignCenter)
        layout.addWidget(subtitle)

        central.setStyleSheet(
            "background: qlineargradient(x1:0, y1:0, x2:1, y2:1, "
            "stop:0 #0f172a, stop:1 #1e293b);"
        )

    def closeEvent(self, event):
        event.ignore()
        self.hide()


class TrayApp:
    def __init__(self):
        self.app = QApplication(sys.argv)
        self.app.setQuitOnLastWindowClosed(False)

        self.window = HelloWorldWindow()

        icon_path = resource_path(os.path.join("assets", "icon.png"))
        if os.path.exists(icon_path):
            self.icon = QIcon(icon_path)
        else:
            self.icon = QIcon.fromTheme("audio-input-microphone")

        self.tray = QSystemTrayIcon(self.icon)
        self.tray.setToolTip("WakeWord App - starting...")

        menu = QMenu()
        open_action = QAction("Open Window", menu)
        open_action.triggered.connect(self.show_window)
        menu.addAction(open_action)
        quit_action = QAction("Quit", menu)
        quit_action.triggered.connect(self.quit_app)
        menu.addAction(quit_action)

        self.tray.setContextMenu(menu)
        self.tray.show()

        self.listener = None
        self.wake_signal = WakeWordSignal()
        self.wake_signal.detected.connect(self.show_window)

        QTimer.singleShot(100, self._ensure_models_then_listen)

    def _ensure_models_then_listen(self):
        if models_ready():
            self._start_listener()
            return

        self.tray.setToolTip("WakeWord App - downloading models...")
        self.dl_signal = DownloadSignal()
        self.dl_signal.finished.connect(self._on_dl_finished)
        self.dl_thread = DownloadThread(self.dl_signal)
        self.dl_thread.start()

    def _on_dl_finished(self, ok, err):
        if ok:
            self._start_listener()
        else:
            self.tray.setToolTip("WakeWord App - setup failed")
            self.tray.showMessage(
                "Setup Failed",
                "Could not download models. Check your internet and restart.",
                QSystemTrayIcon.MessageIcon.Critical,
                5000,
            )

    def _start_listener(self):
        self.tray.setToolTip("WakeWord App - listening...")
        self.listener = WakeWordListener(self.wake_signal)
        self.listener.start()

    def show_window(self):
        self.window.show()
        self.window.raise_()
        self.window.activateWindow()

    def quit_app(self):
        if self.listener:
            self.listener.stop()
        self.tray.hide()
        self.app.quit()

    def run(self):
        sys.exit(self.app.exec())
