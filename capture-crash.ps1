# #region agent log
# Captures Android logcat from a connected device while the user reproduces
# the APK crash. Supports either USB or Wireless ADB (Android 11+).
# Each filtered logcat line is appended to debug-a4aac4.log as NDJSON.

[CmdletBinding()]
param(
    [string]$WirelessAddress = ''   # e.g. 192.168.1.42:43215
)

$ErrorActionPreference = 'Stop'

function Resolve-AdbPath {
    foreach ($root in @($env:ANDROID_SDK_ROOT, $env:ANDROID_HOME)) {
        if (-not $root) { continue }
        $p = Join-Path $root 'platform-tools\adb.exe'
        if (Test-Path -LiteralPath $p) { return $p }
    }
    $local = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
    if (Test-Path -LiteralPath $local) { return $local }
    $cmd = Get-Command adb -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    return $null
}

$adb = Resolve-AdbPath
$pkg       = 'com.leooa.fastingtracker'
$logPath   = Join-Path (Get-Location) 'debug-a4aac4.log'
$sessionId = 'a4aac4'

function Write-Ndjson([string]$location, [string]$message, $data, [string]$hypothesisId = '') {
    $payload = [ordered]@{
        sessionId = $sessionId
        id        = "log_$([DateTimeOffset]::Now.ToUnixTimeMilliseconds())_$(Get-Random -Minimum 1000 -Maximum 9999)"
        timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
        location  = $location
        message   = $message
        data      = $data
        runId     = 'apk-crash-run1'
    }
    if ($hypothesisId) { $payload.hypothesisId = $hypothesisId }
    Add-Content -Path $logPath -Value ($payload | ConvertTo-Json -Compress -Depth 6) -Encoding UTF8
}

if (-not $adb) { Write-Host "adb not found. Set ANDROID_HOME or install Android SDK platform-tools."; exit 1 }

if ($WirelessAddress) {
    Write-Host "==> Connecting to $WirelessAddress over Wi-Fi..." -ForegroundColor Cyan
    & $adb connect $WirelessAddress | Tee-Object -Variable wifiOutput | Out-Host
    Write-Ndjson 'capture-crash.ps1:wifi-connect' "adb connect $WirelessAddress" @{ output = ($wifiOutput -join "`n") }
}

Write-Host "==> Checking devices..." -ForegroundColor Cyan
$devicesRaw = & $adb devices
$devicesRaw | Out-Host
$deviceLines = $devicesRaw | Where-Object { $_ -match "^\S+\s+device$" }
if (-not $deviceLines) {
    Write-Host ""
    Write-Host "ERROR: No Android device usable by adb." -ForegroundColor Red
    Write-Host ""
    Write-Host "WIRELESS option (no cable, Android 11+):"
    Write-Host "  1. Phone Settings -> System -> Developer options -> Wireless debugging -> ON"
    Write-Host "  2. Tap 'Pair device with pairing code' to get an IP:PORT and 6-digit code"
    Write-Host "  3. From this PC: adb pair <IP:PORT> (enter code), then adb connect <IP:DIFFERENT_PORT>"
    Write-Host "  4. Re-run this script with -WirelessAddress <IP:DIFFERENT_PORT>"
    Write-Host ""
    Write-Host "USB option:"
    Write-Host "  1. Phone Settings -> Developer options -> USB debugging ON"
    Write-Host "  2. Plug in via USB cable, accept the RSA prompt on the phone, re-run this script"
    Write-Ndjson 'capture-crash.ps1:no-device' 'No usable adb device' @{ devicesOutput = ($devicesRaw -join "`n") }
    exit 1
}
$deviceId = ($deviceLines[0] -split '\s+')[0]
Write-Host "==> Using device: $deviceId" -ForegroundColor Green
Write-Ndjson 'capture-crash.ps1:device' 'Device detected' @{ deviceId = $deviceId }

Write-Host "==> Force-stopping app and clearing logcat..." -ForegroundColor Cyan
& $adb shell am force-stop $pkg | Out-Null
& $adb logcat -c | Out-Null

Write-Host ""
Write-Host "==> NOW: tap the Fasting Tracker icon on your phone." -ForegroundColor Yellow
Write-Host "    Recording... will stop 15s after a crash, or 60s total."
Write-Host ""

$startedAt   = Get-Date
$timeoutSec  = 60
$lastEntryAt = $startedAt
$crashSeen   = $false
$tmp = Join-Path $env:TEMP "logcat-$sessionId.txt"
if (Test-Path $tmp) { Remove-Item $tmp -Force }

$proc = Start-Process -FilePath $adb -ArgumentList @('logcat','-v','threadtime') -RedirectStandardOutput $tmp -PassThru -WindowStyle Hidden

try {
    $position = 0
    while ($true) {
        Start-Sleep -Milliseconds 250
        if (-not (Test-Path $tmp)) { continue }

        $fs = [System.IO.File]::Open($tmp, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
        $fs.Position = $position
        $sr = New-Object System.IO.StreamReader($fs)
        while (-not $sr.EndOfStream) {
            $line = $sr.ReadLine()
            $position = $fs.Position
            if (-not $line) { continue }

            $tag = $null
            $tagMap = @(
                @('FATAL EXCEPTION',      'fatal',           'A,B,C,D,E,G'),
                @('AndroidRuntime',       'androidruntime',  'A,B,C,D,E,G'),
                @('libc',                 'native',          'A,B,C,E,G'),
                @('DEBUG',                'tombstone',       'A,B,C,E,G'),
                @('CRASH',                'crash',           'A,B,C,D,E,G'),
                @('UnsatisfiedLinkError', 'unsatisfied-link','A,G'),
                @('NoClassDefFoundError', 'no-class',        'B,G'),
                @('SoLoader',             'soloader',        'A,G'),
                @('hermes',               'hermes',          'E,G'),
                @('worklet',              'worklet',         'A,C,G'),
                @('reanimated',           'reanimated',      'A,C,G'),
                @('ReactNativeJS',        'rnjs',            'C,D'),
                @('persist',              'persist',         'D'),
                @('AsyncStorage',         'asyncstorage',    'D'),
                @('EdgeToEdge',           'edgetoedge',      'B'),
                @($pkg,                   'app',             '')
            )
            foreach ($t in $tagMap) {
                if ($line -match [regex]::Escape($t[0])) { $tag = $t[1]; $hypIds = $t[2]; break }
            }
            if (-not $tag) { continue }

            Write-Ndjson "logcat:$tag" $line @{ raw = $line } $hypIds
            if ($tag -in @('fatal','androidruntime','native','tombstone','crash','unsatisfied-link','no-class')) {
                if (-not $crashSeen) { Write-Host "  >> CRASH detected: $line" -ForegroundColor Magenta }
                $crashSeen   = $true
                $lastEntryAt = Get-Date
            }
        }
        $sr.Dispose()
        $fs.Dispose()

        $elapsed = ((Get-Date) - $startedAt).TotalSeconds
        if ($crashSeen -and ((Get-Date) - $lastEntryAt).TotalSeconds -gt 15) {
            Write-Host "==> Crash captured. Stopping..." -ForegroundColor Green; break
        }
        if ($elapsed -gt $timeoutSec) {
            Write-Host "==> Timeout. Stopping..." -ForegroundColor Yellow; break
        }
    }
} finally {
    if ($proc -and -not $proc.HasExited) {
        try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
    }
}

Write-Ndjson 'capture-crash.ps1:done' 'Capture finished' @{ crashSeen = $crashSeen; logFile = $logPath }
$bytes = (Get-Item $logPath -ErrorAction SilentlyContinue).Length
Write-Host ""
Write-Host "==> Wrote $bytes bytes to $logPath" -ForegroundColor Green
if (-not $crashSeen) { Write-Host "==> No FATAL/UnsatisfiedLinkError seen. Did the app actually crash this run?" -ForegroundColor Yellow }
# #endregion
