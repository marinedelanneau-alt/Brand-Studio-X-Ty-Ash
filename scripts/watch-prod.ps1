[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $root ".runtime"
$lockFile = Join-Path $runtimeDir "next-sync.lock"
$statusFile = Join-Path $runtimeDir "next-sync.status.log"
$deploymentFile = Join-Path $runtimeDir "deployment-version.txt"
$stopScript = Join-Path $PSScriptRoot "stop-app.ps1"
$startScript = Join-Path $PSScriptRoot "start-app.ps1"

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

function Write-Status {
  param([string]$Message)

  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  "$timestamp $Message" | Tee-Object -FilePath $statusFile -Append
}

function Get-WatchedFiles {
  $watchedFiles = @()

  $directories = @("app", "lib", "public", "supabase")
  foreach ($directory in $directories) {
    $path = Join-Path $root $directory
    if (Test-Path $path) {
      $watchedFiles += Get-ChildItem -Path $path -Recurse -File -ErrorAction SilentlyContinue
    }
  }

  $files = @("package.json", "package-lock.json", "next.config.ts", ".env.local")
  foreach ($file in $files) {
    $path = Join-Path $root $file
    if (Test-Path $path) {
      $watchedFiles += Get-Item $path -ErrorAction SilentlyContinue
    }
  }

  return $watchedFiles
}

function Get-TreeFingerprint {
  $files = Get-WatchedFiles | Sort-Object FullName -Unique
  if (-not $files) {
    return ""
  }

  $parts = foreach ($file in $files) {
    "{0}|{1}|{2}" -f $file.FullName, $file.Length, $file.LastWriteTimeUtc.Ticks
  }

  return [string]::Join("`n", $parts)
}

function Invoke-Restart {
  Write-Status "Build/restart en cours..."

  $deploymentVersion = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds().ToString()
  Set-Content -Path $deploymentFile -Value $deploymentVersion

  & cmd.exe /c "set DEPLOYMENT_VERSION=$deploymentVersion&& npm.cmd run build"
  if ($LASTEXITCODE -ne 0) {
    Write-Status "Build echoue. La version deja en ligne reste active."
    return
  }

  & $stopScript -KeepSync | Out-Null
  & $startScript | Out-Null
  Write-Status "Prod locale redemarree."
}

if (Test-Path $lockFile) {
  Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
}

Write-Status "Synchronisation auto lancee."
Invoke-Restart

$lastFingerprint = Get-TreeFingerprint

try {
  while ($true) {
    Start-Sleep -Seconds 2
    $currentFingerprint = Get-TreeFingerprint

    if ($currentFingerprint -eq $lastFingerprint) {
      continue
    }

    if (Test-Path $lockFile) {
      continue
    }

    New-Item -ItemType File -Force -Path $lockFile | Out-Null
    try {
      Write-Status "Changement detecte, rebuild/restart."
      Invoke-Restart
      $lastFingerprint = Get-TreeFingerprint
    } finally {
      Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
    }
  }
} finally {
  Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
}
