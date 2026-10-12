Add-Type -AssemblyName System.Drawing

$publicBrand = "A:\Web V2\public\brand"
if (-not (Test-Path $publicBrand)) {
    New-Item -ItemType Directory -Path $publicBrand -Force
}

$sourceJpg = "C:\Users\cường\.gemini\antigravity\brain\f8d866b6-faf1-4e37-b4fe-83404027440e\.user_uploaded\media_1791776887858_5620f13e.jpg"
Copy-Item $sourceJpg "A:\Web V2\public\brand\logo.jpg" -Force
Copy-Item "A:\Web V2\public\brand\logo.jpg" "A:\Web V2\public\logo.jpg" -Force

$img = [System.Drawing.Image]::FromFile("A:\Web V2\public\brand\logo.jpg")

# Save high-res PNGs
$img.Save("A:\Web V2\public\brand\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$img.Save("A:\Web V2\public\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$img.Save("A:\Web V2\src\app\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$img.Save("A:\Web V2\src\app\apple-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Generate 48x48 icon for browser tab
$bmp48 = New-Object System.Drawing.Bitmap 48, 48
$g = [System.Drawing.Graphics]::FromImage($bmp48)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($img, 0, 0, 48, 48)
$g.Dispose()

$hIcon = $bmp48.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = [System.IO.File]::Create("A:\Web V2\public\favicon.ico")
$icon.Save($fs)
$fs.Close()
$bmp48.Dispose()
$img.Dispose()

Write-Host "Brand assets generated successfully!"
