# fasting-tracker
App to track your fasting and water intake.

## Windows: local Android builds (native modules)

CMake/ninja object paths under this repo can exceed the legacy 260-character limit and fail with `Filename longer than 260 characters`. Enable **long paths** for the machine in **elevated** PowerShell (`Run as Administrator`); non-elevated shells (including typical IDE tooling) get `Requested registry access is not allowed` when writing HKLM:

`New-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name 'LongPathsEnabled' -Value 1 -PropertyType DWord -Force`

Reboot if needed, then run a **full clean rebuild** and reinstall the APK so native `.so` artifacts are not mismatched.

For debug sessions, capture evidence in **the same PowerShell window where you ran the build** so `$LASTEXITCODE` reflects that build:

`.\scripts\debug-write-844992.ps1 -Message 'describe build' -ExitCode $LASTEXITCODE -GradleLogPath 'path\to\gradle-output.txt'`

(Optional) Check the raw registry value anytime: `(Get-ItemProperty -LiteralPath 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem').LongPathsEnabled` — expect `1` before trusting long CMake paths on Windows.
