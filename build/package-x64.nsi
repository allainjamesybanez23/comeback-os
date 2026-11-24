Unicode true
Name "Comeback OS"
OutFile "${OUTPUT_EXE}"
RequestExecutionLevel user
AutoCloseWindow true
SetCompressor /SOLID lzma
Icon "icon.ico"
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "Comeback OS"
VIAddVersionKey "FileVersion" "1.0.0"
VIAddVersionKey "LegalCopyright" "Comeback OS"

!ifdef PORTABLE
SilentInstall silent
VIAddVersionKey "FileDescription" "Comeback OS Portable"
Section
  InitPluginsDir
  SetOutPath "$PLUGINSDIR\app"
  File /r "${APP_DIR}\*"
  ExecWait '"$PLUGINSDIR\app\Comeback OS.exe"' $0
  SetErrorLevel $0
SectionEnd
!else
!include "MUI2.nsh"
!define UNINSTALL_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\local.comebackos.training"
!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"
VIAddVersionKey "FileDescription" "Comeback OS Setup"
InstallDir "$LOCALAPPDATA\Programs\Comeback OS"
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Function .onInit
  StrCpy $INSTDIR "$LOCALAPPDATA\Programs\Comeback OS"
  SetShellVarContext current
  SetRegView 64
FunctionEnd

Section "Comeback OS"
  SetOutPath "$INSTDIR"
  File /r "${APP_DIR}\*"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateShortcut "$SMPROGRAMS\Comeback OS.lnk" "$INSTDIR\Comeback OS.exe"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayName" "Comeback OS"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayVersion" "1.0.0"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "Publisher" "Comeback OS"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "DisplayIcon" "$INSTDIR\Comeback OS.exe"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINSTALL_KEY}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINSTALL_KEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINSTALL_KEY}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  SetRegView 64
  SetShellVarContext current
  !include "${REMOVE_FILES}"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\Comeback OS.lnk"
  DeleteRegKey HKCU "${UNINSTALL_KEY}"
SectionEnd
!endif
