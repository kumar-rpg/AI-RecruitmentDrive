<#
    Bootstrap for Windows PowerShell.
      .\setup.ps1 [-SkipBuild] [-SkipInstall] [-NonInteractive]

    This only checks that Node exists and is new enough - everything else lives
    in scripts/setup.mjs, which needs Node to run in the first place.

    If Windows blocks the script, either run it once as:
      powershell -ExecutionPolicy Bypass -File .\setup.ps1
    or allow local scripts for your user:
      Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
#>
[CmdletBinding()]
param(
    [switch]$SkipBuild,
    [switch]$SkipInstall,
    [switch]$NonInteractive
)

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

$minMajor = 18
$minMinor = 17

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host 'ERROR: Node.js is not installed (or not on PATH).' -ForegroundColor Red
    Write-Host ''
    Write-Host 'Install the current LTS, then re-run this script:'
    Write-Host '  winget install OpenJS.NodeJS.LTS'
    Write-Host '  or download from https://nodejs.org'
    exit 1
}

$nodeVersion = (& node --version).TrimStart('v')
$parts = $nodeVersion.Split('.')
$major = [int]$parts[0]
$minor = [int]$parts[1]

if ($major -lt $minMajor -or ($major -eq $minMajor -and $minor -lt $minMinor)) {
    Write-Host "ERROR: Node $nodeVersion is too old. Next.js 14 needs $minMajor.$minMinor+." -ForegroundColor Red
    Write-Host 'Install the current LTS from https://nodejs.org and re-run.'
    exit 1
}

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
    Write-Host 'ERROR: npm is not installed (or not on PATH).' -ForegroundColor Red
    Write-Host 'It normally ships with Node - reinstall Node from https://nodejs.org.'
    exit 1
}

$forwarded = @()
if ($SkipBuild)      { $forwarded += '--skip-build' }
if ($SkipInstall)    { $forwarded += '--skip-install' }
if ($NonInteractive) { $forwarded += '--non-interactive' }

& node scripts/setup.mjs @forwarded
exit $LASTEXITCODE
