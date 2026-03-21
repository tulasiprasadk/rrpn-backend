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
        git add api/index.js -f
        # Verify file exists before push
        if (Test-Path "api/index.js") { Write-Host "Verified api/index.js exists." } else { Write-Host "WARNING: api/index.js missing!" -ForegroundColor Red }
        
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