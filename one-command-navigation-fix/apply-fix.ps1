$ErrorActionPreference = 'Stop'
$patch = Join-Path $PSScriptRoot 'indira-navigation-favicon-fix.patch'
git apply --check $patch
git apply $patch
Write-Host 'Fix applied successfully. Run: git status, then git add src; git commit -m "Fix navigation and favicon"; git push origin main'
