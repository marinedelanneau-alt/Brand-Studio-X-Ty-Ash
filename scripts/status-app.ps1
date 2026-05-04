$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $root ".runtime\next-start.pid"
$port = 3000

$pidValue = ""
if (Test-Path $pidFile) {
  $pidLine = Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  $pidValue = if ($null -ne $pidLine) { $pidLine.ToString().Trim() } else { "" }
}

$process = $null

if ($pidValue) {
  $process = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
}

if (-not $process) {
  $connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if ($null -ne $connection) {
    $pidValue = $connection.OwningProcess.ToString()
    $process = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
    if ($process) {
      Set-Content -Path $pidFile -Value $pidValue
    }
  }
}

if (-not $process) {
  Write-Host "Serveur arrete."
  Remove-Item $pidFile -ErrorAction SilentlyContinue
  exit 1
}

Write-Host "Serveur actif sur http://localhost:$port (PID $pidValue)."
