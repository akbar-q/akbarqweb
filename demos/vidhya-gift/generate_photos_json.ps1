param(
  [string]$PhotosDir = "$PSScriptRoot\photos",
  [string]$OutFile = "$PSScriptRoot\photos\photos.json"
)

$extensions = @(".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".jfif")

if (-not (Test-Path -LiteralPath $PhotosDir)) {
  throw "Photos directory not found: $PhotosDir"
}

$files = Get-ChildItem -LiteralPath $PhotosDir -File |
  Where-Object { $extensions -contains $_.Extension.ToLowerInvariant() } |
  Sort-Object Name

$items = foreach ($f in $files) {
  $title = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
  [PSCustomObject]@{
    file  = $f.Name
    title = $title
  }
}

$items | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $OutFile -Encoding UTF8
Write-Host "Wrote $($items.Count) items to $OutFile"
