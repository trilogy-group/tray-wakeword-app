[Setup]
AppName=Jarvis WakeWord
AppVersion=1.0.0
AppPublisher=Trilogy
AppPublisherURL=https://github.com/trilogy-group/tray-wakeword-app
DefaultDirName={autopf}\JarvisWakeWord
DefaultGroupName=Jarvis WakeWord
UninstallDisplayIcon={app}\JarvisWakeWord.exe
OutputDir=installer_output
OutputBaseFilename=JarvisWakeWord-Setup-1.0.0
SetupIconFile=..\assets\icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional shortcuts:"
Name: "startupicon"; Description: "Start with Windows"; GroupDescription: "Startup:"

[Files]
Source: "dist\JarvisWakeWord\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Jarvis WakeWord"; Filename: "{app}\JarvisWakeWord.exe"
Name: "{group}\Uninstall Jarvis WakeWord"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Jarvis WakeWord"; Filename: "{app}\JarvisWakeWord.exe"; Tasks: desktopicon
Name: "{userstartup}\Jarvis WakeWord"; Filename: "{app}\JarvisWakeWord.exe"; Tasks: startupicon

[UninstallDelete]
Type: filesandordirs; Name: "{localappdata}\JarvisWakeWord"

[Run]
Filename: "{app}\JarvisWakeWord.exe"; Description: "Launch Jarvis WakeWord"; Flags: nowait postinstall skipifsilent
