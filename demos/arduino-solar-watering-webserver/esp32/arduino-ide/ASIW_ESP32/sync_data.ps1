$ErrorActionPreference = 'Stop'

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Join-Path $here '..\..\..\public'
$dst = Join-Path $here 'data'

$src = (Resolve-Path $src).Path
$dst = (Resolve-Path $here).Path + "\data"

Write-Host "Syncing dashboard files into Arduino IDE sketch data folder:" -ForegroundColor Cyan
Write-Host "  From: $src"
Write-Host "  To:   $dst"

if (-not (Test-Path $src)) {
  throw "Source folder not found: $src"
}

New-Item -ItemType Directory -Force -Path $dst | Out-Null

# Clean destination
if (Test-Path $dst) {
  Get-ChildItem -Path $dst -Force | Remove-Item -Recurse -Force
}

Copy-Item -Path (Join-Path $src '*') -Destination $dst -Recurse -Force

$count = (Get-ChildItem -Path $dst -Recurse -File | Measure-Object).Count
Write-Host "Copied $count files." -ForegroundColor Cyan

$index = Join-Path $dst 'index.html'
if (-not (Test-Path $index)) {
  throw "Sync failed: index.html not found at $index"
}

Write-Host "Done. Now upload LittleFS from Arduino IDE." -ForegroundColor Green
