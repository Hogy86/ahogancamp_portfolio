<#.SYNOPSIS
  Creates a self-signed localhost cert in ./certs using OpenSSL (browser may warn).
#>
param(
  [string]$OutDir = (Join-Path (Split-Path $PSScriptRoot -Parent) 'certs')
)

$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$key = Join-Path $OutDir 'localhost-key.pem'
$pem = Join-Path $OutDir 'localhost.pem'

Write-Host "Writing self-signed cert to $OutDir (browsers may show a security warning)."
openssl req -x509 -nodes -newkey rsa:2048 -days 825 `
  -keyout $key -out $pem `
  -subj "/CN=localhost" `
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

Write-Host "Done: $pem"
