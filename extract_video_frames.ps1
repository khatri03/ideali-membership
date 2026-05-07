param(
  [Parameter(Mandatory = $true)]
  [string]$VideoPath,

  [Parameter(Mandatory = $true)]
  [string]$OutputDir
)

Add-Type -AssemblyName PresentationCore,PresentationFramework,WindowsBase

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

function Save-VideoFrame {
  param(
    [Parameter(Mandatory = $true)]
    [System.Windows.Media.MediaPlayer]$Player,

    [Parameter(Mandatory = $true)]
    [double]$Seconds,

    [Parameter(Mandatory = $true)]
    [string]$FileName
  )

  $Player.Position = [TimeSpan]::FromSeconds($Seconds)
  Start-Sleep -Milliseconds 700

  $width = 1280
  $height = 720
  $visual = New-Object System.Windows.Media.DrawingVisual
  $dc = $visual.RenderOpen()
  $dc.DrawVideo($Player, [System.Windows.Rect]::new(0, 0, $width, $height))
  $dc.Close()

  $rtb = New-Object System.Windows.Media.Imaging.RenderTargetBitmap(
    $width,
    $height,
    96,
    96,
    [System.Windows.Media.PixelFormats]::Pbgra32
  )
  $rtb.Render($visual)

  $encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
  $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($rtb))

  $stream = New-Object System.IO.FileStream(
    (Join-Path $OutputDir $FileName),
    [System.IO.FileMode]::Create
  )
  try {
    $encoder.Save($stream)
  }
  finally {
    $stream.Close()
  }
}

$player = New-Object System.Windows.Media.MediaPlayer
$player.Volume = 0
$player.Open([Uri]$VideoPath)
$player.Play()
Start-Sleep -Milliseconds 1500
$player.Pause()

$duration = 8.0
if ($player.NaturalDuration.HasTimeSpan) {
  $duration = $player.NaturalDuration.TimeSpan.TotalSeconds
}

$sampleTimes = @(
  [Math]::Min(0.5, [Math]::Max(0.1, $duration * 0.05)),
  [Math]::Min([Math]::Max(1.5, $duration * 0.50), [Math]::Max(0.5, $duration - 1.0)),
  [Math]::Max(0.5, $duration - 0.5)
)

$index = 1
foreach ($time in $sampleTimes) {
  Save-VideoFrame -Player $player -Seconds $time -FileName ("frame_{0}.png" -f $index)
  $index++
}

$player.Close()

Write-Host "Saved frames to $OutputDir"
