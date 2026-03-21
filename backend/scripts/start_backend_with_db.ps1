<#
start_backend_with_db.ps1
Usage: run from repo root (or specify path)
  powershell -ExecutionPolicy Bypass -File .\scripts\start_backend_with_db.ps1 -DatabaseUrl 'postgres://user:pass@host:5432/db' [-UseSsl]

What it does:
 - sets DATABASE_URL (and DB_SSL if -UseSsl)
 - starts the backend in a detached process
 - waits for /api/products/health to respond
 - calls /api/products?debug=true and prints the JSON (masked dbInfo)
 - prints how to stop the backend process

NOTE: Keep your DATABASE_URL secret. Do not paste it into public chat.
#>
param(
  [Parameter(Mandatory=$false)] [string]$DatabaseUrl,
  [switch]$UseSsl
)

# If not provided, try to read from existing env
if (-not $DatabaseUrl) {
  if ($env:DATABASE_URL) {
    $DatabaseUrl = $env:DATABASE_URL
  } else {
    Write-Host "DATABASE_URL not provided and not found in environment. Use -DatabaseUrl to provide it." -ForegroundColor Yellow
    exit 1
  }
}

# Set env vars for this process (children inherit these)
$env:DATABASE_URL = $DatabaseUrl
if ($UseSsl) { $env:DB_SSL = 'true' } else { if ($env:DB_SSL) { Remove-Item Env:\DB_SSL -ErrorAction SilentlyContinue } }

# Masked display of the URL for confirmation
$masked = $DatabaseUrl -replace '://(.*@)', '://****@'
Write-Host "Using DATABASE_URL: $masked"
if ($UseSsl) { Write-Host "DB_SSL= true" }

# Start backend from repo root; backend folder path
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Resolve-Path (Join-Path $scriptRoot "..")
$backendDir = Join-Path $repoRoot 'backend'

Write-Host "Starting backend from: $backendDir"

# Start node server in a detached process so this script can continue
$proc = Start-Process -FilePath node -ArgumentList 'index.js' -WorkingDirectory $backendDir -PassThru
Write-Host "Started node with PID $($proc.Id)"

# Wait for health endpoint
$uri = 'http://localhost:3000/api/products/health'
$maxWait = 30
for ($i=0; $i -lt $maxWait; $i++) {
  try {
    $res = Invoke-RestMethod -Uri $uri -Method GET -TimeoutSec 2
    if ($res -and $res.ok) {
      Write-Host "Backend health OK"
      break
    }
  } catch {
    Start-Sleep -Seconds 1
  }
  if ($i -eq ($maxWait-1)) {
    Write-Host "Timed out waiting for backend health endpoint. Check logs in the backend window or run 'node backend/index.js' manually." -ForegroundColor Red
    Write-Host "You can stop the started process with: Stop-Process -Id $($proc.Id)" -ForegroundColor Yellow
    exit 1
  }
}

# Call debug products endpoint
try {
  $debugUri = 'http://localhost:3000/api/products?debug=true'
  $json = Invoke-RestMethod -Uri $debugUri -Method GET -TimeoutSec 5
  Write-Host "\n/api/products?debug=true result:" -ForegroundColor Cyan
  $json | ConvertTo-Json -Depth 6
} catch {
  Write-Host "Failed to call debug endpoint: $_" -ForegroundColor Red
}

Write-Host "\nIf you want to stop the backend process started by this script run:" -ForegroundColor Green
Write-Host "Stop-Process -Id $($proc.Id)"

Write-Host "Or view logs by running: tail -f <backend log path> or start server manually with 'node backend/index.js' in the backend folder." -ForegroundColor Yellow
