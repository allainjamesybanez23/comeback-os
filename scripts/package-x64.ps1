param(
  [Parameter(Mandatory = $true)]
  [string] $MakeNsis
)

$ErrorActionPreference = 'Stop'
$compiler = (Resolve-Path -LiteralPath $MakeNsis).Path
Push-Location (Join-Path $PSScriptRoot '..')
try {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'The application build failed.' }
  node node_modules/electron-builder/out/cli/cli.js --win dir --x64 --publish never
  if ($LASTEXITCODE -ne 0) { throw 'Electron packaging failed.' }

  $appFolder = (Resolve-Path -LiteralPath 'release/win-unpacked').Path
  $releaseFolder = Split-Path $appFolder
  $version = (Get-Content -Raw -LiteralPath package.json | ConvertFrom-Json).version
  $manifest = Join-Path $releaseFolder 'uninstall-files.nsh'
  $entries = Get-ChildItem -LiteralPath $appFolder -Recurse
  $files = $entries | Where-Object { -not $_.PSIsContainer } | ForEach-Object {
    'Delete "$INSTDIR\' + $_.FullName.Substring($appFolder.Length + 1) + '"'
  }
  $folders = $entries | Where-Object PSIsContainer | Sort-Object { -$_.FullName.Length } | ForEach-Object {
    'RMDir "$INSTDIR\' + $_.FullName.Substring($appFolder.Length + 1) + '"'
  }
  @($files) + @($folders) | Set-Content -Encoding utf8 -LiteralPath $manifest
  foreach ($edition in @('Setup', 'Portable')) {
    $destination = Join-Path $releaseFolder "Comeback-OS-$edition-$version.exe"
    $argsForNsis = @("/DOUTPUT_EXE=$destination", "/DAPP_DIR=$appFolder", "/DREMOVE_FILES=$manifest")
    if ($edition -eq 'Portable') { $argsForNsis += '/DPORTABLE' }
    & $compiler @argsForNsis 'build/package-x64.nsi'
    if ($LASTEXITCODE -ne 0) { throw "NSIS could not compile the $edition executable." }
  }
}
finally {
  Pop-Location
}
