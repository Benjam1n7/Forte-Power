# Generates simple, branded PNG assets for the Forte Options Android app.
# Run from the repository root: powershell -File scripts/generate-assets.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot '..\mobile\assets\images'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$orange = [System.Drawing.Color]::FromArgb(255, 255, 91, 53)   # #FF5B35
$cream  = [System.Drawing.Color]::FromArgb(255, 245, 241, 232) # #F5F1E8
$ink    = [System.Drawing.Color]::FromArgb(255, 27, 27, 26)    # #1B1B1A
$white  = [System.Drawing.Color]::White

function New-Canvas([int]$size) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.TextRenderingHint = 'AntiAliasGridFit'
  $g.Clear([System.Drawing.Color]::Transparent)
  return @($bmp, $g)
}

function Draw-Glyph($g, [int]$size, [System.Drawing.Color]$color, [double]$ratio) {
  $fontSize = [float]($size * $ratio)
  $font = New-Object System.Drawing.Font('Segoe UI Black', $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = 'Center'
  $fmt.LineAlignment = 'Center'
  $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
  $brush = New-Object System.Drawing.SolidBrush($color)
  $g.DrawString('F', $font, $brush, $rect, $fmt)
  $brush.Dispose(); $font.Dispose(); $fmt.Dispose()
}

function Save-PNG($bmp, $g, [string]$name) {
  $g.Dispose()
  $path = Join-Path $outDir $name
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "wrote $path"
}

# 1. App icon (1024): orange rounded square + white F
$size = 1024
$bmp, $g = New-Canvas $size
$g.Clear($orange)
$radius = [int]($size * 0.2)
$path = [System.Drawing.Drawing2D.GraphicsPath]::new()
$path.AddArc(0, 0, $radius * 2, $radius * 2, 180, 90)
$path.AddArc($size - $radius * 2, 0, $radius * 2, $radius * 2, 270, 90)
$path.AddArc($size - $radius * 2, $size - $radius * 2, $radius * 2, $radius * 2, 0, 90)
$path.AddArc(0, $size - $radius * 2, $radius * 2, $radius * 2, 90, 90)
$path.CloseFigure()
$g.SetClip($path)
Draw-Glyph $g $size $white 0.62
Save-PNG $bmp $g 'icon.png'

# 2. Android adaptive foreground (transparent bg, white F)
$bmp, $g = New-Canvas $size
Draw-Glyph $g $size $white 0.66
Save-PNG $bmp $g 'android-icon-foreground.png'

# 3. Android adaptive background (solid orange)
$bmp, $g = New-Canvas $size
$g.Clear($orange)
Save-PNG $bmp $g 'android-icon-background.png'

# 4. Monochrome (themed icon): white F on transparent
$bmp, $g = New-Canvas $size
Draw-Glyph $g $size $white 0.66
Save-PNG $bmp $g 'android-icon-monochrome.png'

# 5. Splash icon (cream glyph, centered, on transparent; splash bg set in app.json)
$size = 512
$bmp, $g = New-Canvas $size
Draw-Glyph $g $size $ink 0.7
Save-PNG $bmp $g 'splash-icon.png'

# 6. Favicon
$size = 48
$bmp, $g = New-Canvas $size
$g.Clear($orange)
Draw-Glyph $g $size $white 0.66
Save-PNG $bmp $g 'favicon.png'

Write-Host 'All assets generated.'
