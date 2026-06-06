# Start React UI (proxies /api → Python backend on :8000)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "Node.js/npm required. Install from https://nodejs.org/"
}

if (-not (Test-Path "node_modules")) {
    npm install
}

Write-Host "==> Marvel Rocks Society UI" -ForegroundColor Cyan
Write-Host "    http://localhost:3000" -ForegroundColor Yellow
Write-Host "    API proxy -> http://localhost:8000 (start python_app\dev.ps1 first)" -ForegroundColor DarkGray

npm run dev
