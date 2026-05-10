# Appends one NDJSON line to debug-844992.log for debug-mode analysis (session 844992).
# Run after an Android/native build attempt, e.g.:
#   .\scripts\debug-write-844992.ps1 -Message 'gradle release' -ExitCode $LASTEXITCODE

[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Message,
    [int]$ExitCode = -1,
    [string]$HypothesisId = 'F',
    [string]$GradleLogPath = '',
    [string]$RunId = 'local-build-verify'
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$logPath = Join-Path $repoRoot 'debug-844992.log'

$longPathsDword = 'unreadable'
$longPathsReadable = 'unreadable'
try {
    $prop = Get-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name LongPathsEnabled -ErrorAction Stop
    $longPathsDword = [int]$prop.LongPathsEnabled
    $longPathsReadable = ($longPathsDword -eq 1)
} catch {
    $longPathsDword = 'unreadable'
    $longPathsReadable = 'unreadable'
}

$gradleSnip = ''
if ($GradleLogPath -and (Test-Path -LiteralPath $GradleLogPath)) {
    $tail = Get-Content -LiteralPath $GradleLogPath -Tail 80 -ErrorAction SilentlyContinue
    $match = @($tail | Where-Object { $_ -match '260 characters|BUILD SUCCESSFUL|BUILD FAILED|ninja: error|FAILURE:' } | Select-Object -First 3)
    $joined = $match -join "`n"
    if ($joined.Length -gt 2000) { $gradleSnip = $joined.Substring(0, 2000) } else { $gradleSnip = $joined }
}

$payload = [ordered]@{
    sessionId    = '844992'
    id           = "log_$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())_$(Get-Random -Minimum 1000 -Maximum 9999)"
    timestamp    = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    location     = 'scripts/debug-write-844992.ps1'
    message      = $Message
    runId        = $RunId
    hypothesisId = $HypothesisId
    data         = @{
        exitCode           = $ExitCode
        longPathsEnabled   = $longPathsReadable
        longPathsDword     = $longPathsDword
        gradleTailMatch    = $gradleSnip
        repoRootCharCount  = $repoRoot.Length
    }
}

Add-Content -LiteralPath $logPath -Value ($payload | ConvertTo-Json -Compress -Depth 8) -Encoding UTF8
Write-Host "Wrote 1 NDJSON line to $logPath" -ForegroundColor Green
