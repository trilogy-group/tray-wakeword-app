#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== Building JarvisWakeWord for Linux ==="

echo "[1/2] Cleaning previous build..."
rm -rf for_linux/dist for_linux/build

echo "[2/2] Running PyInstaller..."
python -m PyInstaller for_linux/JarvisWakeWord.spec \
    --distpath for_linux/dist \
    --workpath for_linux/build

echo ""
echo "=== Done ==="
echo "App directory: for_linux/dist/JarvisWakeWord/"
echo ""
echo "To install system-wide for your user, run:"
echo "  bash for_linux/install.sh"
