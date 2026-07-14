<#.SYNOPSIS
  Starts Arcade UFO via Docker Compose, waits for the port, opens a dedicated browser window,
  and optionally runs docker compose down when that browser exits (DEVOPS-WIN-001..016).
#>
param()

$ErrorActionPreference = 'Stop'

function Get-RepoRoot {
  $here = $PSScriptRoot
  return (Resolve-Path (Join-Path $here '..')).Path
}

$RepoRoot = Get-RepoRoot
Set-Location $RepoRoot

if (-not (Test-Path (Join-Path $RepoRoot 'docker-compose.yml'))) {
  Write-Error "docker-compose.yml not found. Run from repo root (Start in) or set location to: $RepoRoot"
  exit 2
}

$composeFile = Join-Path $RepoRoot 'docker-compose.yml'
$envPath = Join-Path $RepoRoot '.env'
if (-not (Test-Path $envPath)) {
  Write-Host "No .env found — copying defaults from .env.example"
  Copy-Item (Join-Path $RepoRoot '.env.example') $envPath
}

# Load .env into process env (simple KEY=VAL parser)
Get-Content $envPath | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $p = $_.IndexOf('=')
  if ($p -lt 1) { return }
  $k = $_.Substring(0, $p).Trim()
  $v = $_.Substring($p + 1).Trim()
  [System.Environment]::SetEnvironmentVariable($k, $v, 'Process')
}

$tlsMode = [System.Environment]::GetEnvironmentVariable('TLS_MODE')
if ([string]::IsNullOrWhiteSpace($tlsMode)) { $tlsMode = 'https' }
$httpsPort = [System.Environment]::GetEnvironmentVariable('HTTPS_PORT')
if ([string]::IsNullOrWhiteSpace($httpsPort)) { $httpsPort = '443' }
$httpPort = [System.Environment]::GetEnvironmentVariable('HTTP_PORT')
if ([string]::IsNullOrWhiteSpace($httpPort)) { $httpPort = '80' }
$autoDown = [System.Environment]::GetEnvironmentVariable('AUTO_DOWN_ON_BROWSER_CLOSE')
if ([string]::IsNullOrWhiteSpace($autoDown)) { $autoDown = 'true' }

function Test-DockerAvailable {
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { return $false }
  & docker version *> $null
  return $LASTEXITCODE -eq 0
}

if (-not (Test-DockerAvailable)) {
  Write-Host "ERROR: Docker CLI not available or Docker Desktop is not running."
  exit 3
}

if ($tlsMode -eq 'https') {
  $cert = [System.Environment]::GetEnvironmentVariable('TLS_CERT_PATH')
  $key = [System.Environment]::GetEnvironmentVariable('TLS_KEY_PATH')
  if ([string]::IsNullOrWhiteSpace($cert)) { $cert = '/certs/localhost.pem' }
  if ([string]::IsNullOrWhiteSpace($key)) { $key = '/certs/localhost-key.pem' }
  $hostCertDir = [System.Environment]::GetEnvironmentVariable('HOST_CERT_DIR')
  if ([string]::IsNullOrWhiteSpace($hostCertDir)) { $hostCertDir = 'certs' }
  $rel = $hostCertDir -replace '^\./', ''
  $hostCertFull = Join-Path $RepoRoot $rel
  $leafCert = Split-Path $cert -Leaf
  $leafKey = Split-Path $key -Leaf
  $hostPem = Join-Path $hostCertFull $leafCert
  $hostKey = Join-Path $hostCertFull $leafKey
  if (-not (Test-Path $hostPem) -or -not (Test-Path $hostKey)) {
    Write-Host "ERROR: TLS_MODE=https but cert files are missing under $hostCertFull"
    Write-Host "Expected: $leafCert and $leafKey (or set TLS_MODE=http in .env)."
    exit 4
  }
}

try {
  docker compose -f $composeFile up -d
} catch {
  Write-Host "ERROR: docker compose up failed: $_"
  exit 5
}

$targetPort = if ($tlsMode -eq 'https') { [int]$httpsPort } else { [int]$httpPort }
$scheme = if ($tlsMode -eq 'https') { 'https' } else { 'http' }
$url = if ($targetPort -eq 443 -and $scheme -eq 'https') { 'https://localhost/' }
elseif ($targetPort -eq 80 -and $scheme -eq 'http') { 'http://localhost/' }
else { "$scheme://localhost:$targetPort/" }

Write-Host "Waiting for TCP $targetPort (localhost)..."
$ready = $false
for ($i = 0; $i -lt 120; $i++) {
  try {
    $t = Test-NetConnection -ComputerName localhost -Port $targetPort -WarningAction SilentlyContinue
    if ($t.TcpTestSucceeded) { $ready = $true; break }
  } catch { }
  Start-Sleep -Milliseconds 500
}
if (-not $ready) {
  Write-Host "ERROR: Port $targetPort did not become reachable within 60s. Check docker compose logs."
  exit 6
}

$browserProc = $null
try {
  $edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
  if (Test-Path $edge) {
    $browserProc = Start-Process -FilePath $edge -ArgumentList @('--app=' + $url.TrimEnd('/')) -PassThru
  } else {
    $browserProc = Start-Process -FilePath $url -PassThru
  }
} catch {
  Write-Host "ERROR: Failed to open browser: $_"
  exit 7
}

if ($autoDown -eq 'true' -and $browserProc) {
  try {
    Wait-Process -Id $browserProc.Id -ErrorAction SilentlyContinue
  } finally {
    Write-Host "Browser session ended — stopping compose stack..."
    try { docker compose -f $composeFile down --remove-orphans } catch { }
  }
}

exit 0
