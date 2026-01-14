# OAuth Setup Helper Script
Write-Host "=== Google OAuth Setup Helper ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host ".env file created!" -ForegroundColor Green
}

# Generate random secrets
function Generate-RandomString {
    param([int]$Length = 32)
    -join ((65..90) + (97..122) + (48..57) | Get-Random -Count $Length | ForEach-Object {[char]$_})
}

Write-Host ""
Write-Host "=== Generated Random Secrets ===" -ForegroundColor Cyan
$sessionSecret = Generate-RandomString 32
$jwtSecret = Generate-RandomString 32

Write-Host "SESSION_SECRET: $sessionSecret" -ForegroundColor Yellow
Write-Host "JWT_SECRET: $jwtSecret" -ForegroundColor Yellow

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Get Google OAuth credentials from:" -ForegroundColor White
Write-Host "   https://console.cloud.google.com/apis/credentials" -ForegroundColor Blue
Write-Host ""
Write-Host "2. Edit .env file and add:" -ForegroundColor White
Write-Host "   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com" -ForegroundColor Yellow
Write-Host "   GOOGLE_CLIENT_SECRET=your-client-secret" -ForegroundColor Yellow
Write-Host "   SESSION_SECRET=$sessionSecret" -ForegroundColor Yellow
Write-Host "   JWT_SECRET=$jwtSecret" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Add callback URLs in Google Console:" -ForegroundColor White
Write-Host "   http://localhost:3000/api/customers/auth/google/callback" -ForegroundColor Blue
Write-Host "   http://localhost:3000/api/suppliers/auth/google/callback" -ForegroundColor Blue
Write-Host ""
Write-Host "4. Start the backend:" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor Green
Write-Host ""
Write-Host "5. Test OAuth status:" -ForegroundColor White
Write-Host "   curl http://localhost:3000/api/auth/status" -ForegroundColor Green
Write-Host ""

# Check if credentials are already set
$envContent = Get-Content .env -ErrorAction SilentlyContinue
if ($envContent) {
    $hasClientId = $envContent | Select-String -Pattern "GOOGLE_CLIENT_ID=.+googleusercontent"
    $hasClientSecret = $envContent | Select-String -Pattern "GOOGLE_CLIENT_SECRET=.+"
    
    if ($hasClientId -and $hasClientSecret) {
        Write-Host "=== Status ===" -ForegroundColor Green
        Write-Host "Google OAuth credentials found in .env" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now start the server with: npm start" -ForegroundColor Cyan
    } else {
        Write-Host "=== Status ===" -ForegroundColor Yellow
        Write-Host "Google OAuth credentials not found in .env" -ForegroundColor Yellow
        Write-Host "Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET" -ForegroundColor Yellow
    }
}
