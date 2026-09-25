param(
    [Parameter(Mandatory = $true)]
    [string]$TestEmail,

    [Parameter(Mandatory = $true)]
    [string]$TestPassword,

    [string]$JMeterCommand = "jmeter",
    [string]$HostName = "localhost",
    [int]$Port = 3001
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$plan = Join-Path $scriptDir "EventoPlanners_Milestone15_Performance_Test.jmx"
$resultsRoot = Join-Path $scriptDir "results"

if (-not (Test-Path $plan)) {
    throw "JMeter plan not found: $plan"
}

New-Item -ItemType Directory -Force -Path $resultsRoot | Out-Null

$tiers = @(
    @{ Name = "baseline"; Threads = 5;  RampUp = 5;  Loops = 5  },
    @{ Name = "load";     Threads = 25; RampUp = 25; Loops = 10 },
    @{ Name = "stress";   Threads = 75; RampUp = 60; Loops = 10 }
)

foreach ($tier in $tiers) {
    $tierDir = Join-Path $resultsRoot $tier.Name
    $jtl = Join-Path $resultsRoot ("{0}.jtl" -f $tier.Name)

    if (Test-Path $tierDir) {
        Remove-Item $tierDir -Recurse -Force
    }
    if (Test-Path $jtl) {
        Remove-Item $jtl -Force
    }

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ("Running {0}: {1} users, {2}s ramp-up, {3} loops" -f $tier.Name, $tier.Threads, $tier.RampUp, $tier.Loops) -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan

    & $JMeterCommand `
        -n `
        -t $plan `
        -Jhost=$HostName `
        -Jport=$Port `
        -JtestEmail=$TestEmail `
        -JtestPassword=$TestPassword `
        -Jthreads=$($tier.Threads) `
        -JrampUp=$($tier.RampUp) `
        -Jloops=$($tier.Loops) `
        -JthinkTime=250 `
        -l $jtl `
        -e `
        -o $tierDir

    if ($LASTEXITCODE -ne 0) {
        throw "JMeter $($tier.Name) test failed with exit code $LASTEXITCODE."
    }

    Write-Host ("Completed {0}. HTML report: {1}\index.html" -f $tier.Name, $tierDir) -ForegroundColor Green
}

Write-Host ""
Write-Host "All three performance tiers completed." -ForegroundColor Green
Write-Host ("Results folder: {0}" -f $resultsRoot) -ForegroundColor Green
