#!/usr/bin/env bash
set -euo pipefail

APP_NAME="JarvisWakeWord"

INSTALL_DIR="$HOME/.local/share/$APP_NAME"
BIN_LINK="$HOME/.local/bin/$APP_NAME"
DESKTOP_FILE="$HOME/.local/share/applications/$APP_NAME.desktop"
ICON_FILE="$HOME/.local/share/icons/hicolor/256x256/apps/$APP_NAME.png"
DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/$APP_NAME"

echo "=== Uninstalling $APP_NAME ==="

[ -d "$INSTALL_DIR" ] && rm -rf "$INSTALL_DIR" && echo "Removed $INSTALL_DIR"
[ -L "$BIN_LINK" ]    && rm -f  "$BIN_LINK"    && echo "Removed $BIN_LINK"
[ -f "$DESKTOP_FILE" ] && rm -f "$DESKTOP_FILE" && echo "Removed $DESKTOP_FILE"
[ -f "$ICON_FILE" ]   && rm -f  "$ICON_FILE"   && echo "Removed $ICON_FILE"

echo ""
read -rp "Also remove downloaded models in $DATA_DIR? [y/N] " ans
if [[ "${ans,,}" == "y" ]]; then
    rm -rf "$DATA_DIR"
    echo "Removed $DATA_DIR"
fi

echo "=== Uninstall complete ==="
