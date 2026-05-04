$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $root ".runtime"
$pidFile = Join-Path $runtimeDir "next-start.pid"
$outLog = Join-Path $runtimeDir "next-start.out.log"
$errLog = Join-Path $runtimeDir "next-start.err.log"
$hostName = "127.0.0.1"
$port = 3000

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

function Get-ListeningProcessId {
  $connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if ($null -eq $connection) {
    return ""
  }

  return $connection.OwningProcess.ToString()
}

if (Test-Path $pidFile) {
  $existingPidLine = Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  $existingPid = if ($null -ne $existingPidLine) { $existingPidLine.ToString().Trim() } else { "" }
  if ($existingPid) {
    $running = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
    if ($running) {
      Write-Host "L'application tourne deja sur http://localhost:$port (PID $existingPid)."
      exit 0
    }
  }

  Remove-Item $pidFile -ErrorAction SilentlyContinue
}

$listeningPid = Get-ListeningProcessId
if ($listeningPid) {
  Set-Content -Path $pidFile -Value $listeningPid
  Write-Host "L'application tourne deja sur http://localhost:$port (PID $listeningPid)."
  exit 0
}

$nodeExe = (Get-Command node).Source
$nextCli = Join-Path $root "node_modules\next\dist\bin\next"
$arguments = "`"$nextCli`" dev --webpack --hostname $hostName --port $port"

Start-Process `
  -FilePath $nodeExe `
  -ArgumentList $arguments `
  -WorkingDirectory $root `
  -RedirectStandardOutput $outLog `
  -RedirectStandardError $errLog `
  -WindowStyle Hidden | Out-Null

Start-Sleep -Seconds 4
$listeningPid = Get-ListeningProcessId

if (-not $listeningPid) {
  throw "Le serveur Next.js n'a pas demarre correctement."
}

Set-Content -Path $pidFile -Value $listeningPid
Write-Host "Serveur Next.js de developpement lance en arriere-plan sur http://localhost:$port (PID $listeningPid)."
Write-Host "Logs: $outLog"
