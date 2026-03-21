param(
    [string]$BaseUrl = 'http://localhost:3000'
)

Write-Output "Running local tests against: $BaseUrl"

function SafeInvoke($scriptblock) {
    try {
        & $scriptblock
    } catch {
        Write-Output "ERROR: $($_.Exception.Message)"
        if ($_.Exception.Response -ne $null) {
            try { $_.Exception.Response.GetResponseStream() | Get-Content -Raw | Write-Output } catch {}
        }
    }
}

Write-Output "\n=== HEALTH ==="
SafeInvoke { Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method GET | ConvertTo-Json -Depth 6 }

Write-Output "\n=== PRODUCTS (limit=1) ==="
SafeInvoke { Invoke-RestMethod -Uri "$BaseUrl/api/products?limit=1" -Method GET | ConvertTo-Json -Depth 6 }

Write-Output "\n=== GUEST ADDRESS: POST ==="
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$body = @{ label='Home'; line1='1 Main St'; city='City'; zip='12345' } | ConvertTo-Json
SafeInvoke { Invoke-RestMethod -Uri "$BaseUrl/api/customer/address/guest" -Method POST -ContentType 'application/json' -Body $body -WebSession $session | ConvertTo-Json -Depth 6 }

Write-Output "\n=== GUEST ADDRESS: GET ==="
SafeInvoke { Invoke-RestMethod -Uri "$BaseUrl/api/customer/address/guest" -Method GET -WebSession $session | ConvertTo-Json -Depth 6 }

Write-Output "\nFinished local checks. If you need authenticated address tests, run your local auth flow and re-run with a session cookie."
