<#
PowerShell helper to move `birthday` content into `memorial`.
Run from the repo root (PowerShell):

  .\scripts\move_birthday_to_memorial.ps1

This will:
- move `birthday\images` -> `memorial\images` (if present)
- move small files (images.json, scripts, README) into `memorial`
- replace occurrences of "/memorial/" with "/memorial/" in text files
#>

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition | Split-Path -Parent
$birthday = Join-Path $repoRoot 'birthday'
$memorial = Join-Path $repoRoot 'memorial'

if(-not (Test-Path $birthday)){
    Write-Host "No birthday folder found at $birthday" -ForegroundColor Yellow
    exit 1
}

if(-not (Test-Path $memorial)){
    New-Item -ItemType Directory -Path $memorial | Out-Null
}

# Move images dir if present
$bImages = Join-Path $birthday 'images'
$mImages = Join-Path $memorial 'images'
if(Test-Path $bImages){
    if(Test-Path $mImages){
        Write-Host "Memorial images folder already exists; merging contents..." -ForegroundColor Yellow
        Get-ChildItem -Path $bImages -File | ForEach-Object { Move-Item -Path $_.FullName -Destination $mImages -Force }
        Remove-Item -Path $bImages -Recurse -Force
    } else {
        Move-Item -Path $bImages -Destination $mImages -Force
    }
    Write-Host "Moved images to memorial/images" -ForegroundColor Green
} else {
    Write-Host "No birthday images folder to move." -ForegroundColor Yellow
}

# Move small files
$toMove = 'images.json','generate_images_json.ps1','README.md'
foreach($f in $toMove){
    $src = Join-Path $birthday $f
    if(Test-Path $src){ Move-Item -Path $src -Destination $memorial -Force; Write-Host "Moved $f" -ForegroundColor Green }
}

# Replace references in text files
$ext = '*.html','*.js','*.css','*.md','*.json','*.ps1'
Get-ChildItem -Path $repoRoot -Recurse -File -Include $ext | ForEach-Object {
    (Get-Content -Raw -Path $_.FullName) -replace '/memorial/','/memorial/' | Set-Content -Path $_.FullName -Force
}

# Remove birthday folder if empty
try{
    $items = Get-ChildItem -Path $birthday -Force
    if(-not $items){ Remove-Item -Path $birthday -Recurse -Force; Write-Host "Removed empty birthday folder" -ForegroundColor Green }
} catch { Write-Host "Could not remove birthday folder (maybe not empty)." -ForegroundColor Yellow }

Write-Host "Done. Verify your site and commit changes." -ForegroundColor Cyan

