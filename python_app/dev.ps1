# Start Python API (development mode with auto-reload)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

if (-not (Test-Path ".venv")) {
    Write-Host "Virtual environment not found. Run .\setup.ps1 first." -ForegroundColor Red
    exit 1
}

& .\.venv\Scripts\Activate.ps1

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}

Write-Host "==> Marvel Rocks Society API (Python + SQL Server Developer)" -ForegroundColor Cyan
Write-Host "    http://localhost:8000/docs" -ForegroundColor Yellow

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
