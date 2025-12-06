<#
Generate images.json listing for the memorial page.
Place this script inside the `memorial` folder and run it in PowerShell.
It will scan the ./images folder (non-recursive), sort by LastWriteTime (chronological),
and write `images.json` (an array of paths like "images/filename.jpg").
#>

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$imagesDir = Join-Path $scriptDir 'images'
$out = Join-Path $scriptDir 'images.json'

if(-not (Test-Path $imagesDir)){
    Write-Host "Images folder not found at $imagesDir. Create it and put your images there." -ForegroundColor Yellow
    exit 1
}

# Remove old images.json if it exists to avoid lock issues
if(Test-Path $out){
    try {
        Remove-Item $out -Force
    } catch {
        Write-Host "Warning: Could not remove old $out, will overwrite." -ForegroundColor Yellow
    }
}

$extensions = '*.jpg','*.jpeg','*.png','*.webp','*.gif'
$files = Get-ChildItem -Path $imagesDir -File | Where-Object { $extensions -contains ('*' + $_.Extension) } | Sort-Object LastWriteTime
if(-not $files){ 
    Write-Host "No image files found in $imagesDir" -ForegroundColor Yellow
    exit 1 
}

$list = @($files | ForEach-Object { "images/$($_.Name)" })

# Write with retry logic in case of lock
$maxRetries = 5
$retryCount = 0
$written = $false

while(-not $written -and $retryCount -lt $maxRetries){
    try {
        $list | ConvertTo-Json -Depth 1 | Out-File -Encoding UTF8 -FilePath $out -Force
        $written = $true
        Write-Host "✓ Wrote $($list.Count) entries to $out" -ForegroundColor Green
    } catch {
        $retryCount++
        if($retryCount -lt $maxRetries){
            Write-Host "Retry $retryCount/$maxRetries: Failed to write (lock?), waiting 500ms..." -ForegroundColor Yellow
            Start-Sleep -Milliseconds 500
        } else {
            Write-Host "✗ Failed to write $out after $maxRetries retries: $_" -ForegroundColor Red
            exit 1
        }
    }
}

