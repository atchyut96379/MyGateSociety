# Marvel Rocks Society — Python + SQL Server Developer setup (Windows)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host "==> Python + SQL Server Developer Edition setup" -ForegroundColor Cyan

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    throw "Python 3.11+ is required. Install from https://www.python.org/downloads/"
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker is required for local SQL Server Developer Edition."
}

docker info 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Docker Desktop is not running. Start Docker Desktop, wait until it is ready, then run setup.ps1 again."
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created python_app/.env from .env.example"
}

if (-not (Test-Path ".venv")) {
    python -m venv .venv
    Write-Host "Created virtual environment"
}

& .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

Set-Location ..
Write-Host "==> Starting SQL Server Developer Edition (Docker)..." -ForegroundColor Cyan
docker compose up -d db

Write-Host "==> Waiting for SQL Server..." -ForegroundColor Cyan
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
    docker compose exec -T db bash -c "/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'MyGate_Dev12345' -C -Q 'SELECT 1' 2>/dev/null || /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'MyGate_Dev12345' -C -Q 'SELECT 1'" 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $ready = $true
        break
    }
    Start-Sleep -Seconds 2
}
if (-not $ready) {
    throw "SQL Server did not become ready in time. Check: docker compose logs db"
}

Set-Location $Root
Write-Host "==> Creating tables and seeding data..." -ForegroundColor Cyan
python -m app.seed

Write-Host ""
Write-Host "Setup complete." -ForegroundColor Green
Write-Host "  SQL Server: localhost:1433 (Developer Edition)"
Write-Host "  Database:   mygatesociety"
Write-Host "  Login:      9999999001 / MarvADM / ADMIN"
Write-Host ""
Write-Host "Run the API:  .\dev.ps1" -ForegroundColor Yellow
