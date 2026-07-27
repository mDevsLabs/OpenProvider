#Requires -Version 5.1
$ErrorActionPreference = "Stop"

Write-Host "Installing openprovider..." -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js 18+ is required. Install Node from https://nodejs.org/ and rerun this script."
    exit 1
}

$nodeVersion = & node -p "process.versions.node"
$nodeMajor = [int]($nodeVersion.Split(".")[0])
if ($nodeMajor -lt 18) {
    Write-Error "Node.js 18+ is required. Current version: v$nodeVersion"
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm is required to install the published openprovider package."
    exit 1
}

Write-Host "Using Node v$nodeVersion"

# Install openprovider globally
# If npm reports "install scripts blocked" for bun, rerun as:
#   npm install -g --allow-scripts=bun @mdevs/openprovider
# (use an elevated PowerShell if the original install was elevated)
$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npm) {
    $npm = Get-Command npm -ErrorAction Stop
}
& $npm.Source install -g @mdevs/openprovider
if ($LASTEXITCODE -ne 0) {
    Write-Error "npm install failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

$opr = Get-Command opr.cmd -ErrorAction SilentlyContinue
if (-not $opr) {
    $opr = Get-Command opr -ErrorAction SilentlyContinue
}
if (-not $opr) {
    $npmPrefix = & $npm.Source prefix -g
    Write-Error "openprovider installed, but 'opr' is not on PATH. Add your npm global bin directory to PATH, then reopen PowerShell: $npmPrefix"
    exit 1
}

& $opr.Source help *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Error "openprovider installed, but 'opr.cmd help' failed with exit code $LASTEXITCODE. Check your npm global install and PATH."
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "openprovider installed! Run 'opr init' to set up." -ForegroundColor Green

