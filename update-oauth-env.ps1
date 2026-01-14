# Script to update OAuth credentials in .env file
param(
    [string]$ClientId,
    [string]$ClientSecret
)

if (-not $ClientId -or -not $ClientSecret) {
    Write-Host "Usage: .\update-oauth-env.ps1 -ClientId 'your-client-id' -ClientSecret 'your-client-secret'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or run interactively:" -ForegroundColor Cyan
    $ClientId = Read-Host "Enter your GOOGLE_CLIENT_ID"
    $ClientSecret = Read-Host "Enter your GOOGLE_CLIENT_SECRET"
}

if (-not (Test-Path .env)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item .env.example .env -ErrorAction SilentlyContinue
}

# Read current .env
$envContent = Get-Content .env -Raw

# Update GOOGLE_CLIENT_ID
$envContent = $envContent -replace "GOOGLE_CLIENT_ID=.*", "GOOGLE_CLIENT_ID=$ClientId"

# Update GOOGLE_CLIENT_SECRET
$envContent = $envContent -replace "GOOGLE_CLIENT_SECRET=.*", "GOOGLE_CLIENT_SECRET=$ClientSecret"

# Update SESSION_SECRET if still placeholder
if ($envContent -match "SESSION_SECRET=your-secret-key-change-this-in-production") {
    $sessionSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    $envContent = $envContent -replace "SESSION_SECRET=your-secret-key-change-this-in-production", "SESSION_SECRET=$sessionSecret"
    Write-Host "Generated new SESSION_SECRET" -ForegroundColor Green
}

# Update JWT_SECRET if needed
if ($envContent -notmatch "JWT_SECRET=") {
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    $envContent += "`nJWT_SECRET=$jwtSecret`n"
    Write-Host "Added JWT_SECRET" -ForegroundColor Green
}

# Ensure FRONTEND_URL is set
if ($envContent -notmatch "FRONTEND_URL=") {
    $envContent += "`nFRONTEND_URL=http://localhost:5173`n"
    Write-Host "Added FRONTEND_URL" -ForegroundColor Green
}

# Write back to .env
$envContent | Set-Content .env -NoNewline

Write-Host ""
Write-Host "=== Updated .env file ===" -ForegroundColor Green
Write-Host "GOOGLE_CLIENT_ID: $ClientId" -ForegroundColor Cyan
Write-Host "GOOGLE_CLIENT_SECRET: [HIDDEN]" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now start the server with: npm start" -ForegroundColor Yellow
