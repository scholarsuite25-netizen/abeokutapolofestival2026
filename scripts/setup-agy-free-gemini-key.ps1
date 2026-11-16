<#
.SYNOPSIS
  Runs the Antigravity CLI (agy) on a free Gemini API key instead of the weekly Antigravity quota.

.DESCRIPTION
  Writes %USERPROFILE%\.gemini\antigravity-cli\settings.json with {"modelProvider":"gemini"}
  and stores GEMINI_API_KEY at user level. Requests then go straight to the Gemini API
  (separate free daily limits, no Antigravity weekly lock).

  Get a free key at https://aistudio.google.com (no card required).
  Undo at any time with: .\scripts\setup-agy-free-gemini-key.ps1 -Remove

.PARAMETER ApiKey
  Gemini API key. If omitted you are prompted (input hidden).

.PARAMETER Remove
  Deletes the custom settings and clears the stored key, returning agy to Google sign-in.

.EXAMPLE
  .\scripts\setup-agy-free-gemini-key.ps1
  .\scripts\setup-agy-free-gemini-key.ps1 -ApiKey "AIza..."
  .\scripts\setup-agy-free-gemini-key.ps1 -Remove
#>
[CmdletBinding()]
param(
  [string]$ApiKey,
  [switch]$Remove
)

$ErrorActionPreference = "Stop"
$dir = Join-Path $env:USERPROFILE ".gemini\antigravity-cli"
$settingsPath = Join-Path $dir "settings.json"

if ($Remove) {
  if (Test-Path $settingsPath) {
    Remove-Item $settingsPath -Force
    Write-Host "Removed $settingsPath - agy will use Google sign-in again." -ForegroundColor Yellow
  } else {
    Write-Host "No custom settings file found (agy already uses Google sign-in)."
  }
  [Environment]::SetEnvironmentVariable("GEMINI_API_KEY", $null, "User")
  Write-Host "Cleared user-level GEMINI_API_KEY. Restart your terminal, then run: agy" -ForegroundColor Yellow
  return
}

if (-not $ApiKey) {
  $secure = Read-Host "Paste your Gemini API key (from aistudio.google.com) - input hidden" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { $ApiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}
if ([string]::IsNullOrWhiteSpace($ApiKey)) { throw "No API key provided. Nothing changed." }

New-Item -ItemType Directory -Force -Path $dir | Out-Null
if (Test-Path $settingsPath) {
  Copy-Item $settingsPath "$settingsPath.bak" -Force
  Write-Host "Backed up previous settings to $settingsPath.bak"
}

@{ modelProvider = "gemini" } | ConvertTo-Json | Set-Content -Path $settingsPath -Encoding UTF8
[Environment]::SetEnvironmentVariable("GEMINI_API_KEY", $ApiKey, "User")
$env:GEMINI_API_KEY = $ApiKey

Write-Host ""
Write-Host "Configured $settingsPath" -ForegroundColor Green
Write-Host "GEMINI_API_KEY stored at user level - open a new terminal before running agy."
Write-Host ""
Write-Host "Free-tier capacity (Oct-Nov 2026 readings - verify in AI Studio):" -ForegroundColor Cyan
Write-Host "  Gemini 3.8 Flash        5 RPM /   20 requests per day"
Write-Host "  Gemini 3.x Flash-Lite  15 RPM /  500 requests per day"
Write-Host "  Gemma 4                30 RPM / 14,400 requests per day"
Write-Host "  Reset: midnight Pacific. Limits are per PROJECT, not per key."
Write-Host ""
Write-Host "Notes:" -ForegroundColor Yellow
Write-Host "  - Free-tier content may be used to improve Google products: never paste staff credentials."
Write-Host "  - Verify: run 'agy' and check the header reads 'Gemini API key'."
Write-Host "  - Undo  : .\scripts\setup-agy-free-gemini-key.ps1 -Remove"
