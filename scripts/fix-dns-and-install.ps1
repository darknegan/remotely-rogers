# Run as Administrator (right-click → Run with PowerShell as admin)
# Fixes Norton Secure DNS (127.0.0.2) blocking npm, then installs dependencies.

$ErrorActionPreference = 'Stop'

Write-Host "Fixing DNS on Ethernet adapter..." -ForegroundColor Cyan
Set-DnsClientServerAddress -InterfaceAlias 'Ethernet' -ServerAddresses @('1.1.1.1', '8.8.8.8')
Clear-DnsClientCache

# Norton HTTPS scanning breaks Node's default CA store on v25+
Write-Host "Setting NODE_OPTIONS=--use-system-ca for your user account..." -ForegroundColor Cyan
[System.Environment]::SetEnvironmentVariable('NODE_OPTIONS', '--use-system-ca', 'User')
$env:NODE_OPTIONS = '--use-system-ca'

Write-Host "Testing registry.npmjs.org..." -ForegroundColor Cyan
npm ping 2>&1 | Write-Host

if ($LASTEXITCODE -ne 0) {
    Write-Host "npm still cannot reach the registry. In Norton: disable Secure DNS / VPN DNS, or pause Norton, then run this script again." -ForegroundColor Red
    exit 1
}

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

if (Test-Path "$projectRoot\node_modules") {
    Write-Host "Removing old node_modules (OneDrive can leave partial installs)..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "$projectRoot\node_modules" -ErrorAction SilentlyContinue
}

Write-Host "Running npm install in $projectRoot ..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "Done. Open a new terminal and run: npm run start" -ForegroundColor Green
}
