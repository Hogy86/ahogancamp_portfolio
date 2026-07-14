<#.SYNOPSIS
  Creates a Desktop shortcut "Arcade UFO (Local)" per PRD DEVOPS-WIN-006..008.
  Adjust $RepoRoot if your clone path differs.
#>
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'
$WshShell = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$lnkPath = Join-Path $desktop 'Arcade UFO (Local).lnk'
$shortcut = $WshShell.CreateShortcut($lnkPath)
$shortcut.TargetPath = 'powershell.exe'
$shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $RepoRoot 'scripts\launch-arcade-ufo.ps1')`""
$shortcut.WorkingDirectory = $RepoRoot
$shortcut.WindowStyle = 1
$shortcut.Description = 'Arcade UFO — Docker Compose + browser'
$shortcut.Save()
Write-Host "Created: $lnkPath"
