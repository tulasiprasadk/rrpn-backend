# Script to push Backend and Frontend to GitHub

# --- Configuration ---
$backendPath = "d:\RRPN"
$backendRepo = "https://github.com/tulasiprasadk/rrpn-backend.git"

# I will look for frontend in 'frontend' folder or 'rrpn-frontend' folder next to this one
$frontendPathsToCheck = @("d:\RRPN\frontend", "d:\RRPN\..\rrpn-frontend", "d:\RRPN\..\frontend")
$frontendRepo = "https://github.com/tulasiprasadk/rrpn-frontend.git"

Function Push-Repo {
    param($path, $repoUrl, $name)
    if (Test-Path $path) {
        Write-Host "`n----------------------------------------" -ForegroundColor Cyan
        Write-Host "Processing $name at: $path" -ForegroundColor Cyan
        Set-Location $path
        
        if (-not (Test-Path ".git")) { 
            Write-Host "Initializing git..."
            git init 
        }
        
        # FIX: Aggressively cleanup git submodule references
        if (Test-Path "backend\.git") {
            Write-Host "Removing nested .git folder in backend..." -ForegroundColor Yellow
            # Use cmd for robust deletion of hidden/readonly .git files
            cmd /c "rmdir /s /q backend\.git"
        }
        if (Test-Path "frontend\.git") {
            Write-Host "Removing nested .git folder in frontend..." -ForegroundColor Yellow
            cmd /c "rmdir /s /q frontend\.git"
        }

        if (Test-Path ".gitmodules") {
            Write-Host "Removing .gitmodules file..." -ForegroundColor Yellow
            Remove-Item -Path ".gitmodules" -Force
        }

        # CRITICAL: Remove 'backend' from the git index specifically. 
        # If git thinks it's a submodule, this command untracks that reference so we can add the files normally.
        Write-Host "Clearing submodule references from git index..."
        git rm --cached backend -r 2>$null
        git rm --cached backend 2>$null
        git rm --cached frontend -r 2>$null
        git rm --cached frontend 2>$null

        Write-Host "Configuring remote..."
        git remote remove origin 2>$null
        git remote add origin $repoUrl
        
        Write-Host "Adding files..."
        git add .
        git add api/index.js -f
        
        Write-Host "Committing..."
        git commit -m "Initial commit of $name"
        
        Write-Host "Pushing to main..."
        git branch -M main
        git push -u origin main --force
        Write-Host "Done with $name!" -ForegroundColor Green
    } else {
        Write-Host "Could not find folder for $name" -ForegroundColor Yellow
    }
}

# 1. Push Backend
Push-Repo -path $backendPath -repoUrl $backendRepo -name "Backend"

# 2. Push Frontend (Try to find it)
foreach ($path in $frontendPathsToCheck) {
    if (Test-Path $path) {
        Push-Repo -path $path -repoUrl $frontendRepo -name "Frontend"
        break
    }
}

Write-Host "`nAll operations completed." -ForegroundColor Green
Pause