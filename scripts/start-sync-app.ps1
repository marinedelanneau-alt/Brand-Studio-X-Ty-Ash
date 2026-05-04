$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $root ".runtime"
$syncPidFile = Join-Path $runtimeDir "next-sync.pid"
$syncOutLog = Join-Path $runtimeDir "next-sync.out.log"
$syncErrLog = Join-Path $runtimeDir "next-sync.err.log"
$watchScript = Join-Path $PSScriptRoot "watch-prod.ps1"

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

if (Test-Path $syncPidFile) {
  $existingPidLine = Get-Content $syncPidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  $existingPid = if ($null -ne $existingPidLine) { $existingPidLine.ToString().Trim() } else { "" }
  if ($existingPid) {
    $running = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
    if ($running) {
      Write-Host "La synchronisation auto est deja active (PID $existingPid)."
      exit 0
    }
  }

  Remove-Item $syncPidFile -ErrorAction SilentlyContinue
}

$watcherProcess = Start-Process `
  -FilePath "powershell.exe" `
  -ArgumentList "-ExecutionPolicy Bypass -File `"$watchScript`"" `
  -WorkingDirectory $root `
  -RedirectStandardOutput $syncOutLog `
  -RedirectStandardError $syncErrLog `
  -WindowStyle Hidden `
  -PassThru

Set-Content -Path $syncPidFile -Value $watcherProcess.Id
Write-Host "Synchronisation auto activee (PID $($watcherProcess.Id))."
Write-Host "A chaque changement de code, la prod locale sera rebuild puis redemarree."
Write-Host "Logs: $syncOutLog"
