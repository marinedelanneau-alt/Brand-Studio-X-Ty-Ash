$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$syncPidFile = Join-Path $root ".runtime\next-sync.pid"

if (-not (Test-Path $syncPidFile)) {
  Write-Host "Synchronisation auto arretee."
  exit 1
}

$pidValue = (Get-Content $syncPidFile -ErrorAction Stop | Select-Object -First 1).Trim()
$process = $null

if ($pidValue) {
  $process = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
}

if (-not $process) {
  Write-Host "Synchronisation auto arretee."
  Remove-Item $syncPidFile -ErrorAction SilentlyContinue
  exit 1
}

Write-Host "Synchronisation auto active (PID $pidValue)."
