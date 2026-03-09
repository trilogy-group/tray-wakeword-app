# -*- mode: python ; coding: utf-8 -*-
import os
from PyInstaller.utils.hooks import collect_all, collect_data_files, collect_dynamic_libs

PROJECT_ROOT = os.path.normpath(os.path.join(SPECPATH, '..'))

datas = [(os.path.join(PROJECT_ROOT, 'assets'), 'assets')]
binaries = []
hiddenimports = []

# openwakeword (code only, NOT models -- downloaded at first run)
try:
    tmp_ret = collect_all('openwakeword')
    datas += [(src, dst) for src, dst in tmp_ret[0]
              if not src.endswith(('.onnx', '.tflite'))]
    binaries += tmp_ret[1]
    hiddenimports += tmp_ret[2]
except Exception:
    pass

# onnxruntime
try:
    tmp_ret = collect_all('onnxruntime')
    datas += tmp_ret[0]
    binaries += tmp_ret[1]
    hiddenimports += tmp_ret[2]
except Exception:
    pass

# sounddevice + PortAudio
try:
    datas += collect_data_files('sounddevice')
    binaries += collect_dynamic_libs('sounddevice')
except Exception:
    pass

hiddenimports += [
    'numpy', 'numpy.core', 'numpy.lib',
    'numpy.linalg', 'numpy.fft', 'numpy.random',
    'sounddevice', 'cffi', '_cffi_backend',
    'openwakeword', 'openwakeword.model', 'openwakeword.utils',
    'onnxruntime', 'onnxruntime.capi',
    'scipy', 'scipy.signal', 'scipy.special',
    'PySide6.QtWidgets', 'PySide6.QtGui', 'PySide6.QtCore',
    'shared', 'shared.config', 'shared.core', 'shared.download', 'shared.ui',
]

a = Analysis(
    [os.path.join(PROJECT_ROOT, 'main.py')],
    pathex=[PROJECT_ROOT],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'PySide6.Qt3DAnimation', 'PySide6.Qt3DCore', 'PySide6.Qt3DExtras',
        'PySide6.Qt3DInput', 'PySide6.Qt3DLogic', 'PySide6.Qt3DRender',
        'PySide6.QtBluetooth', 'PySide6.QtCharts', 'PySide6.QtDataVisualization',
        'PySide6.QtDesigner', 'PySide6.QtGraphs', 'PySide6.QtMultimedia',
        'PySide6.QtMultimediaWidgets', 'PySide6.QtNfc', 'PySide6.QtPositioning',
        'PySide6.QtQuick', 'PySide6.QtQuickWidgets', 'PySide6.QtRemoteObjects',
        'PySide6.QtSensors', 'PySide6.QtSerialPort', 'PySide6.QtSvg',
        'PySide6.QtTest', 'PySide6.QtWebChannel', 'PySide6.QtWebEngine',
        'PySide6.QtWebEngineWidgets', 'PySide6.QtWebSockets', 'PySide6.QtXml',
        'tkinter', 'matplotlib', 'PIL',
    ],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='JarvisWakeWord',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=os.path.join(PROJECT_ROOT, 'assets', 'icon.ico'),
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='JarvisWakeWord',
)
