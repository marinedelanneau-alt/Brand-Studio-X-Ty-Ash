[CmdletBinding()]
param(
  [switch]$KeepSync
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$syncPidFile = Join-Path $root ".runtime\next-sync.pid"
$pidFile = Join-Path $root ".runtime\next-start.pid"
$port = 3000

if (-not $KeepSync -and (Test-Path $syncPidFile)) {
  $syncPidLine = Get-Content $syncPidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  $syncPid = if ($null -ne $syncPidLine) { $syncPidLine.ToString().Trim() } else { "" }
  if ($syncPid) {
    $syncProcess = Get-Process -Id $syncPid -ErrorAction SilentlyContinue
    if ($syncProcess) {
      Stop-Process -Id $syncPid -Force
      Write-Host "Synchronisation auto arretee (PID $syncPid)."
    }
  }

  Remove-Item $syncPidFile -ErrorAction SilentlyContinue
}

$pidValue = ""
if (Test-Path $pidFile) {
  $pidLine = Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  $pidValue = if ($null -ne $pidLine) { $pidLine.ToString().Trim() } else { "" }
}

if (-not $pidValue) {
  $connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if ($null -ne $connection) {
    $pidValue = $connection.OwningProcess.ToString()
  }
}

if (-not $pidValue) {
  Write-Host "Aucun serveur en arriere-plan a arreter."
  exit 0
}

if ($pidValue) {
  $process = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
  if ($process) {
    Stop-Process -Id $pidValue -Force
    Write-Host "Serveur arrete (PID $pidValue)."
  } else {
    Write-Host "Le PID $pidValue n'etait plus actif."
  }
}

Remove-Item $pidFile -ErrorAction SilentlyContinue
