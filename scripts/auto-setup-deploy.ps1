param(
    [string]$GitRemoteUrl = '',
    [string]$VercelToken = '',
    [switch]$StartWatcher
)

function Fail([string]$msg){ Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

# Check for git
try { git --version > $null 2>&1 } catch { Fail 'Git n\'est pas installé ou pas dans le PATH. Installe Git et relance le script.' }

$cwd = Resolve-Path .
Write-Host "Working dir: $cwd"

# Ensure .env.local is ignored
$gitignore = '.gitignore'
if (Test-Path $gitignore) {
    $g = Get-Content $gitignore -Raw
    if ($g -notmatch '\.env.local') {
        "`n# Local env vars`n.env.local" | Out-File -FilePath $gitignore -Encoding utf8 -Append
        Write-Host "Ajouté .env.local à .gitignore"
    }
} else {
    "# Git ignore`n.env.local" | Out-File -FilePath $gitignore -Encoding utf8
    Write-Host "Créé .gitignore et ajouté .env.local"
}

# Init repo if needed
if (-not (Test-Path .git -PathType Container)) {
    git init || Fail 'Impossible d\'initialiser le dépôt Git.'
    Write-Host "Dépôt git initialisé"
}

# Add or set remote if provided
if ($GitRemoteUrl -ne '') {
    $existing = git remote get-url origin 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Remote origin existe déjà: $existing"
    } else {
        git remote add origin $GitRemoteUrl || Fail "Impossible d\'ajouter le remote origin $GitRemoteUrl"
        Write-Host "Remote origin ajouté: $GitRemoteUrl"
    }
}

# Commit changes if present
$status = git status --porcelain
if ($status.Trim() -ne '') {
    git add -A || Fail 'git add a échoué'
    git commit -m "chore: enable RAG, unlock modules, add auto-deploy script" || Write-Host "Aucun commit créé (peut-être pas de modifications)"
    Write-Host "Modifications commitées"
} else {
    Write-Host "Aucune modification à committer"
}

# Ensure branch main and push if remote exists
git branch -M main 2>$null
$remoteUrl = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Pushing to origin main..."
    git push -u origin main 2>&1 | Write-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Push échoué — vérifie tes credentials (SSH ou PAT)."
    } else {
        Write-Host "Push réussi vers origin/main"
    }
} else {
    Write-Host "Aucun remote 'origin' configuré. Si tu veux pusher, relance avec -GitRemoteUrl <url>"
}

# Deploy to Vercel
if ($VercelToken -ne '') {
    $env:VERCEL_TOKEN = $VercelToken
    Write-Host "Déploiement non-interactif avec token fourni..."
    npx vercel --prod --token $env:VERCEL_TOKEN
    if ($LASTEXITCODE -ne 0) { Write-Host "Le déploiement vercel a échoué avec le token fourni." }
} else {
    Write-Host "Aucun token Vercel fourni. Lancement interactif (tu seras invité à te connecter si nécessaire)."
    npx vercel
    Write-Host "Après le lien, exécute: npx vercel --prod (ou exécute à nouveau ce script avec -VercelToken)"
}

# Start watcher if requested
if ($StartWatcher) {
    if (Test-Path './scripts/auto-push-deploy.ps1') {
        Write-Host "Démarrage du watcher auto-push-deploy en arrière-plan..."
        Start-Process -NoNewWindow -FilePath powershell -ArgumentList "-ExecutionPolicy Bypass -File ./scripts/auto-push-deploy.ps1" -WorkingDirectory (Get-Location)
        Write-Host "Watcher démarré"
    } else {
        Write-Host "Le script ./scripts/auto-push-deploy.ps1 est introuvable."
    }
}

Write-Host "Terminé. Vérifie la dashboard Vercel et les logs si nécessaire."