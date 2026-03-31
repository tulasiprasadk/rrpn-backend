# Script to push Backend and Frontend to GitHub

param(
    [string]$CommitMessage = "refactor: Standardize Vercel and local entry points"
)

# --- Configuration ---
$backendPath = $PSScriptRoot
$backendRepo = "https://github.com/tulasiprasadk/rrpn-backend.git"

# I will look for frontend in 'frontend' folder or 'rrpn-frontend' folder next to this one
$frontendPathsToCheck = @("$PSScriptRoot\frontend", "$PSScriptRoot\..\rrpn-frontend", "$PSScriptRoot\..\frontend")
$frontendRepo = "https://github.com/tulasiprasadk/rrpn-frontend.git"
$subscriptionRepo = "" # set to your subscription-system remote, e.g. https://github.com/your-org/rrpn-subscription-system.git

Function Push-Repo {
    param($path, $repoUrl, $name, $msg)
    if (Test-Path $path) {
        Write-Host "`n----------------------------------------" -ForegroundColor Cyan
        Write-Host "Processing $name at: $path" -ForegroundColor Cyan
        Set-Location $path
        
        if (-not (Test-Path ".git")) { 
            Write-Host "Initializing git..."
            git init 
        }
        
        # 1. Remove .gitmodules if exists
        if (Test-Path ".gitmodules") {
            Write-Host "Removing .gitmodules file..." -ForegroundColor Yellow
            Remove-Item -Path ".gitmodules" -Force
        }

        # 2. Find and remove ALL nested .git folders (excluding the main one)
        # This ensures we don't have nested repos causing submodule behavior
        Get-ChildItem -Path . -Directory -Recurse -Filter ".git" -ErrorAction SilentlyContinue | ForEach-Object {
            if ($_.FullName -ne (Join-Path (Get-Location).Path ".git") -and $_.FullName -notmatch "node_modules") {
                Write-Host "Removing nested git repo: $($_.FullName)" -ForegroundColor Yellow
                try { $_.Attributes = "Normal"; Remove-Item -LiteralPath $_.FullName -Force -Recurse -ErrorAction SilentlyContinue } catch {}
            }
        }

        # 3. FLUSH GIT INDEX: Remove everything from git's brain so it rescans files as plain files
        Write-Host "Flushing git index..."
        git rm -r --cached . -q 2>$null

        Write-Host "Configuring remote..."
        git remote remove origin 2>$null
        git remote add origin $repoUrl
        
        Write-Host "Adding files..."
        git add .
        # Conditionally add api/index.js only if it exists (for backend repo)
        if (Test-Path (Join-Path $path "api/index.js")) {
            git add api/index.js -f
            Write-Host "Verified api/index.js exists and was added."
        }
        
        Write-Host "Committing..."
        git commit -m $msg
        
        Write-Host "Pushing to main..."
        git branch -M main
        if (git push -u origin main --force) {
            Write-Host "Done with $name!" -ForegroundColor Green
        } else {
            Write-Error "Failed to push $name"
        }
        
    } else {
        Write-Host "Could not find folder for $name" -ForegroundColor Yellow
    }
}

# 1. Push Backend
Push-Repo -path $backendPath -repoUrl $backendRepo -name "Backend" -msg $CommitMessage

# 2. Push Frontend (Try to find it)
foreach ($path in $frontendPathsToCheck) {
    if (Test-Path $path) {
        Push-Repo -path $path -repoUrl $frontendRepo -name "Frontend"
        break
    }
}

# 3. Push subscription-system module if present and remote supplied
if ($subscriptionRepo -ne "") {
    if (Test-Path (Join-Path $PSScriptRoot "subscription-system")) {
        Push-Repo -path (Join-Path $PSScriptRoot "subscription-system") -repoUrl $subscriptionRepo -name "Subscription System" -msg $CommitMessage
    }
}

Write-Host "`nAll operations completed." -ForegroundColor Green
Pause