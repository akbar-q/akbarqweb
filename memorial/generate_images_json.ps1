<#
Generate images.json listing for the birthday page.
Place this script inside the `birthday` folder and run it in PowerShell.
It will scan the ./images folder (non-recursive), sort by LastWriteTime (chronological),
and write `images.json` (an array of paths like "images/filename.jpg").
#>

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$imagesDir = Join-Path $scriptDir 'images'
$thumbDir = Join-Path $scriptDir 'thumbnails'
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

$extensions = 'jpg','jpeg','png','webp','gif','heic'
$files = Get-ChildItem -Path $imagesDir -File | Where-Object { $extensions -contains ($_.Extension.TrimStart('.').ToLower()) } | Sort-Object LastWriteTime
if(-not $files){ 
    Write-Host "No image files found in $imagesDir" -ForegroundColor Yellow
    exit 1 
}

$list = @()
foreach($f in $files){
    $base = $f.BaseName
    $thumbPath = $null
    if(Test-Path $thumbDir){
        $thumb = Get-ChildItem -Path $thumbDir -File -Filter "$($base).*" | Where-Object { $extensions -contains ($_.Extension.TrimStart('.').ToLower()) } | Select-Object -First 1
        if($thumb){ $thumbPath = "thumbnails/$($thumb.Name)" }
    }
    if(-not $thumbPath){ $thumbPath = "images/$($f.Name)" }
    $list += [PSCustomObject]@{ full = "images/$($f.Name)"; thumb = $thumbPath }
}

# Write with retry logic in case of lock
$maxRetries = 5
$retryCount = 0
$written = $false

while(-not $written -and $retryCount -lt $maxRetries){
    try {
        $list | ConvertTo-Json -Depth 1 | Out-File -Encoding UTF8 -FilePath $out -Force
        $written = $true
            Write-Host ("Wrote {0} entries to {1}" -f $list.Count, $out) -ForegroundColor Green
    } catch {
        $retryCount++
        if($retryCount -lt $maxRetries){
            Write-Host ("Retry {0}/{1}: Failed to write (lock?), waiting 500ms..." -f $retryCount, $maxRetries) -ForegroundColor Yellow
            Start-Sleep -Milliseconds 500
        } else {
                Write-Host ("Failed to write {0} after {1} retries: {2}" -f $out, $maxRetries, $_) -ForegroundColor Red
            exit 1
        }
    }
}

