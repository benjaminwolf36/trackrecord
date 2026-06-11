# Claims the trackrecord npm names with 0.0.1 placeholders.
# Run from your own terminal (browser will pop for npm 2FA, possibly once per package).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

foreach ($pkg in @("trackrecord", "core", "cli")) {
    Push-Location (Join-Path $root $pkg)
    Write-Host "`n=== publishing $pkg ===" -ForegroundColor Cyan
    npm publish --access public
    Pop-Location
}

Write-Host "`nAll three published. Verify:" -ForegroundColor Green
npm view trackrecord version
npm view "@trackrecord/core" version
npm view "@trackrecord/cli" version
