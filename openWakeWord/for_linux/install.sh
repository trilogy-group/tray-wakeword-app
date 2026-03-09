#!/usr/bin/env bash
set -euo pipefail

APP_NAME="JarvisWakeWord"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$SCRIPT_DIR/dist/$APP_NAME"

if [ ! -d "$DIST_DIR" ]; then
    echo "Error: Build not found at $DIST_DIR"
    echo "Run build.sh first."
    exit 1
fi

INSTALL_DIR="$HOME/.local/share/$APP_NAME"
BIN_DIR="$HOME/.local/bin"
APPS_DIR="$HOME/.local/share/applications"
ICON_DIR="$HOME/.local/share/icons/hicolor/256x256/apps"

echo "=== Installing $APP_NAME ==="

echo "[1/4] Copying application files..."
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cp -r "$DIST_DIR"/. "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR/$APP_NAME"

echo "[2/4] Creating command-line launcher..."
mkdir -p "$BIN_DIR"
ln -sf "$INSTALL_DIR/$APP_NAME" "$BIN_DIR/$APP_NAME"

echo "[3/4] Installing icon..."
mkdir -p "$ICON_DIR"
if [ -f "$INSTALL_DIR/assets/icon.png" ]; then
    cp "$INSTALL_DIR/assets/icon.png" "$ICON_DIR/$APP_NAME.png"
fi

echo "[4/4] Creating desktop entry..."
mkdir -p "$APPS_DIR"
cat > "$APPS_DIR/$APP_NAME.desktop" << DESKTOP_EOF
[Desktop Entry]
Type=Application
Name=Jarvis WakeWord
Comment=Wake word detection with system tray
Exec=$INSTALL_DIR/$APP_NAME
Icon=$APP_NAME
Terminal=false
Categories=Audio;Utility;
StartupNotify=false
DESKTOP_EOF
chmod +x "$APPS_DIR/$APP_NAME.desktop"

echo ""
echo "=== Installed successfully ==="
echo "  App location:  $INSTALL_DIR"
echo "  Command:       $APP_NAME  (if ~/.local/bin is in PATH)"
echo "  Desktop entry: $APPS_DIR/$APP_NAME.desktop"
echo ""
echo "Launch from your application menu or run: $APP_NAME"
