@echo off
setlocal

cd /d "%~dp0\.."

echo === Building JarvisWakeWord for Windows ===

echo [1/3] Cleaning previous build...
if exist "for_windows\dist" rmdir /s /q "for_windows\dist"
if exist "for_windows\build" rmdir /s /q "for_windows\build"

echo [2/3] Running PyInstaller...
python -m PyInstaller for_windows\JarvisWakeWord.spec ^
    --distpath for_windows\dist ^
    --workpath for_windows\build
if errorlevel 1 (
    echo PyInstaller failed!
    exit /b 1
)

echo [3/3] Building installer with Inno Setup...
where iscc >nul 2>&1
if errorlevel 1 (
    if exist "C:\InnoSetup\iscc.exe" (
        "C:\InnoSetup\iscc.exe" for_windows\installer.iss
    ) else if exist "C:\Program Files (x86)\Inno Setup 6\iscc.exe" (
        "C:\Program Files (x86)\Inno Setup 6\iscc.exe" for_windows\installer.iss
    ) else (
        echo WARNING: Inno Setup not found. Skipping installer creation.
        echo Install Inno Setup 6 and re-run, or run iscc manually.
    )
) else (
    iscc for_windows\installer.iss
)

echo === Done ===
if exist "for_windows\installer_output\JarvisWakeWord-Setup-1.0.0.exe" (
    echo Installer: for_windows\installer_output\JarvisWakeWord-Setup-1.0.0.exe
)
