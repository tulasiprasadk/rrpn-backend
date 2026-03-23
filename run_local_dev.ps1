<#
.SYNOPSIS
  A robust script to start the local development environment.
.DESCRIPTION
  This script automates the following checks and actions:
  1. Checks if dependencies are installed (node_modules), runs 'npm install' if not.
  2. Checks if the .env file exists, creates it from .env.example if not.
  3. Starts the backend server using 'npm run dev'.
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\run_local_dev.ps1
#>

Write-Host "🚀 Starting local development environment check..." -ForegroundColor Cyan

# 1. Check for node_modules, run npm install if missing
if (-not (Test-Path "node_modules")) {
    Write-Host "Dependencies not found. Running 'npm install'..." -ForegroundColor Yellow
    npm install
}

# 2. Check for .env file, create from example if missing
if (-not (Test-Path ".env")) {
    Write-Host ".env file not found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

Write-Host "✅ Setup complete. Starting server with 'npm run dev'..." -ForegroundColor Green
npm run dev