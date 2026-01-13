# scripts/set-branch-protection.ps1
# Usage: set $env:GITHUB_TOKEN then run this script from repo root

$owner  = 'tulasiprasadk'
$repo   = 'rrnagarfinal-backend'
$branch = 'main'

$token = $env:GITHUB_TOKEN
if (-not $token) {
  Write-Error "Set GITHUB_TOKEN environment variable (PAT with 'repo' scope)."
  exit 1
}

$input = Read-Host "Enter required status check contexts (comma-separated), or leave empty to skip"
$contexts = @()
if ($input -and $input.Trim() -ne '') {
  $contexts = $input.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
}

$required_status_checks = $null
if ($contexts.Count -gt 0) {
  $required_status_checks = @{
    strict = $true
    contexts = $contexts
  }
}

$protectionBody = @{
  required_status_checks = $required_status_checks
  enforce_admins = $true
  required_pull_request_reviews = @{
    dismissal_restrictions = @{}
    dismiss_stale_reviews = $true
    require_code_owner_reviews = $false
    required_approving_review_count = 1
  }
  restrictions = $null
} | ConvertTo-Json -Depth 10

$headers = @{
  Authorization = "token $token"
  Accept        = 'application/vnd.github+json'
  'User-Agent'  = 'set-branch-protection-script'
}

$uri = "https://api.github.com/repos/$owner/$repo/branches/$branch/protection"
Write-Host "Applying branch protection to $owner/$repo@$branch ..."
try {
  Invoke-RestMethod -Method Put -Uri $uri -Headers $headers -Body $protectionBody -ContentType 'application/json' -ErrorAction Stop
  Write-Host "Protection payload applied."
} catch {
  Write-Error "Failed to apply protection: $($_.Exception.Message)"
  exit 1
}

$enforceAdminsBody = @{ enabled = $true } | ConvertTo-Json
$uriAdmins = "https://api.github.com/repos/$owner/$repo/branches/$branch/protection/enforce_admins"
try {
  Invoke-RestMethod -Method Put -Uri $uriAdmins -Headers $headers -Body $enforceAdminsBody -ContentType 'application/json' -ErrorAction Stop
  Write-Host "Enforce admins enabled."
} catch {
  Write-Warning "Failed to set enforce_admins separately. Message: $($_.Exception.Message)"
}

Write-Host "Done. Verify: https://github.com/$owner/$repo/settings/branches"
