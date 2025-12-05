<#
Generate images.json listing for the memorial page.
Place this script inside the `memorial` folder and run it in PowerShell.
It will scan the ./images folder (non-recursive), sort by LastWriteTime (chronological),
and write `images.json` (an array of paths like "images/filename.jpg").
#>

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$imagesDir = Join-Path $scriptDir 'images'
if(-not (Test-Path $imagesDir)){
    Write-Host "Images folder not found at $imagesDir. Create it and put your images there." -ForegroundColor Yellow
    exit 1
}

$extensions = '*.jpg','*.jpeg','*.png','*.webp','*.gif'
$files = Get-ChildItem -Path $imagesDir -File | Where-Object { $extensions -contains ('*' + $_.Extension) } | Sort-Object LastWriteTime
if(-not $files){ Write-Host "No image files found in $imagesDir" -ForegroundColor Yellow; exit 1 }

$list = $files | ForEach-Object { "images/$($_.Name)" }
$out = Join-Path $scriptDir 'images.json'
$list | ConvertTo-Json -Depth 1 | Out-File -Encoding UTF8 $out
Write-Host "Wrote $($list.Count) entries to $out"
