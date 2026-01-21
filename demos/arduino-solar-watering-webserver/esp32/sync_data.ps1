$ErrorActionPreference = 'Stop'

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Join-Path $here '..\public'
$dst = Join-Path $here 'data'

Write-Host "Syncing dashboard files:" -ForegroundColor Cyan
Write-Host "  From: $src"
Write-Host "  To:   $dst"

if (-not (Test-Path $src)) {
  throw "Source folder not found: $src"
}

New-Item -ItemType Directory -Force -Path $dst | Out-Null

# Clean destination (keep it simple; data folder is generated)
Get-ChildItem -Path $dst -Force | Remove-Item -Recurse -Force

Copy-Item -Path (Join-Path $src '*') -Destination $dst -Recurse -Force

Write-Host "Done. Now upload LittleFS from the esp32 project." -ForegroundColor Green
