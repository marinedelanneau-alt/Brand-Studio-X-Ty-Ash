[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$runtimeDir = Join-Path $root ".runtime"
$lockFile = Join-Path $runtimeDir "auto-push-deploy.lock"
$statusFile = Join-Path $runtimeDir "auto-push-deploy.status.log"
$stopScript = Join-Path $PSScriptRoot "stop-app.ps1"
$startScript = Join-Path $PSScriptRoot "start-app.ps1"

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

function Write-Status {
  param([string]$Message)

  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  "$timestamp $Message" | Tee-Object -FilePath $statusFile -Append | Out-Null
}

function Get-WatchedFiles {
  $watchedFiles = @()
  $directories = @("app", "lib", "public", "scripts", "supabase")

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

function Get-GitCommand {
  $gitCommand = Get-Command git -ErrorAction SilentlyContinue
  if ($gitCommand) {
    return $gitCommand.Source
  }

  $candidates = @(
    (Join-Path $env:ProgramFiles "Git\cmd\git.exe"),
    (Join-Path ${env:ProgramFiles(x86)} "Git\cmd\git.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\Git\cmd\git.exe")
  )

  return $candidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
}

function Get-GitRoot {
  $gitCommand = Get-GitCommand
  if (-not $gitCommand) {
    return $null
  }

  try {
    $current = Get-Location
    Set-Location $root
    $result = & $gitCommand rev-parse --show-toplevel 2>$null
    Set-Location $current
    if ($LASTEXITCODE -eq 0) {
      return $result.Trim()
    }

    return $null
  } catch {
    return $null
  }
}

function Get-GitRemoteUrl {
  $gitRoot = Get-GitRoot
  if (-not $gitRoot) {
    return $null
  }

  try {
    $current = Get-Location
    Set-Location $gitRoot
    $gitCommand = Get-GitCommand
    $result = & $gitCommand remote get-url origin 2>$null
    Set-Location $current
    if ($LASTEXITCODE -eq 0) {
      return $result.Trim()
    }

    return $null
  } catch {
    return $null
  }
}

function Has-GitChanges {
  $gitRoot = Get-GitRoot
  if (-not $gitRoot) {
    return $false
  }

  $current = Get-Location
  Set-Location $gitRoot
  $gitCommand = Get-GitCommand
  $status = & $gitCommand status --porcelain 2>$null
  Set-Location $current
  return -not [string]::IsNullOrWhiteSpace($status)
}

function Commit-And-Push {
  $gitRoot = Get-GitRoot
  if (-not $gitRoot) {
    Write-Status "Aucun depot Git detecte. Push ignore."
    return
  }

  $remoteUrl = Get-GitRemoteUrl
  if (-not $remoteUrl) {
    Write-Status "Aucun remote Git configure. Push ignore."
    return
  }

  if (-not (Has-GitChanges)) {
    Write-Status "Aucun changement Git a pousser."
    return
  }

  Write-Status "Changements detectes. Commit et push en cours..."
  $current = Get-Location
  Set-Location $gitRoot

  $gitCommand = Get-GitCommand
  & $gitCommand add -A
  if ($LASTEXITCODE -ne 0) {
    Write-Status "Erreur lors de l'ajout Git."
    Set-Location $current
    return
  }

  $commitMessage = "Auto sync $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
  & $gitCommand commit -m "$commitMessage" 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Status "Aucun commit cree (peut-etre aucun changement a committer ou erreur)."
  } else {
    Write-Status "Commit cree : $commitMessage"
  }

  & $gitCommand push origin HEAD
  if ($LASTEXITCODE -ne 0) {
    Write-Status "Push Git echoue. Verifiez la configuration du remote et des identifiants."
  } else {
    Write-Status "Push Git reussi vers $remoteUrl."
  }

  Set-Location $current
}

function Deploy-Local {
  Write-Status "Build et deploy local en cours..."

  $current = Get-Location
  Set-Location $root

  cmd.exe /c "npm.cmd run build"
  if ($LASTEXITCODE -ne 0) {
    Write-Status "Build echoue. Deploiement interrompu."
    Set-Location $current
    return
  }

  & $stopScript -KeepSync | Out-Null
  & $startScript | Out-Null
  Write-Status "Deploiement local termine avec succes."

  Set-Location $current
}

function Sync-All {
  Commit-And-Push
  Deploy-Local
}

Write-Status "Auto push/deploy lance."
Sync-All

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
      Write-Status "Changement detecte, auto push/deploy en cours."
      Sync-All
      $lastFingerprint = $currentFingerprint
    } finally {
      Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
    }
  }
} finally {
  Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
}
