param([string]$Berkas, [string]$Keluar)
# Render setiap slide ke PNG memakai PowerPoint (renderer asli), tanpa membuka jendela.
New-Item -ItemType Directory -Force $Keluar | Out-Null
Get-ChildItem $Keluar -Filter 'slide-*.png' | Remove-Item -Force -Confirm:$false
$ppt = New-Object -ComObject PowerPoint.Application
try {
  $pres = $ppt.Presentations.Open($Berkas, $true, $false, $false)
  $i = 0
  foreach ($s in $pres.Slides) { $i++; $s.Export((Join-Path $Keluar ('slide-{0:D2}.png' -f $i)), 'PNG', 1600, 900) }
  $pres.Close()
  "dirender $i slide"
} finally { $ppt.Quit(); [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null }
