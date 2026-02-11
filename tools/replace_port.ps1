$files = @(
  'd:\RRPN\frontend-push-temp\dist\assets\index-CzjayqZg.js',
  'd:\RRPN\frontend\android\app\src\main\assets\public\assets\index-CzjayqZg.js'
)
foreach ($f in $files) {
  Write-Host "Patching $f"
  $t = Get-Content -Raw -LiteralPath $f
  $t = $t -replace 'http://localhost:3000','http://localhost:5000'
  Set-Content -LiteralPath $f -Value $t -Encoding utf8
}
Write-Host 'done'
