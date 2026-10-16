# Script to launch Android Emulator and run FLUX on PC
param (
    [string]$AvdName = "Pixel_8"
)

$ErrorActionPreference = "Stop"

# Ensure AVD Home is pointed to M:\Android\avd where Pixel_8 resides
if (Test-Path "M:\Android\avd") {
    $env:ANDROID_AVD_HOME = "M:\Android\avd"
}

$SdkDir = "C:\Users\shifa\AppData\Local\Android\Sdk"
$EmulatorExe = "$SdkDir\emulator\emulator.exe"
$AdbExe = "$SdkDir\platform-tools\adb.exe"
$ApkPath = "$PSScriptRoot\FLUX-Android.apk"

if (-not (Test-Path $ApkPath)) {
    Write-Host "FLUX-Android.apk not found. Building APK first..." -ForegroundColor Yellow
    Set-Location $PSScriptRoot
    npm run build:apk
}

Write-Host "Checking for running Android devices/emulators..." -ForegroundColor Cyan
$devices = & $AdbExe devices | Where-Object { $_ -match "\bdevice\b" }

if (-not $devices) {
    Write-Host "No active emulator found. Starting '$AvdName' AVD with boosted hardware specs..." -ForegroundColor Green
    $emuArgs = @(
        "-avd", $AvdName,
        "-no-boot-anim"
    )
    Start-Process -FilePath $EmulatorExe -ArgumentList $emuArgs
    
    Write-Host "Waiting for emulator to boot up (this may take 20-40 seconds)..." -ForegroundColor Yellow
    & $AdbExe wait-for-device
    
    # Wait until boot completes
    $booted = $false
    while (-not $booted) {
        Start-Sleep -Seconds 2
        $res = & $AdbExe shell getprop sys.boot_completed 2>$null
        if ($res -match "1") {
            $booted = $true
        }
    }

    # Apply buttery-smooth performance settings inside Android OS
    Write-Host "Applying high-performance GPU and UI animation tweaks..." -ForegroundColor Green
    & $AdbExe shell settings put global window_animation_scale 0.75 2>$null
    & $AdbExe shell settings put global transition_animation_scale 0.75 2>$null
    & $AdbExe shell settings put global animator_duration_scale 0.75 2>$null
    & $AdbExe shell setprop debug.sf.hw 1 2>$null
    & $AdbExe shell setprop debug.egl.hw 1 2>$null
    & $AdbExe shell setprop debug.composition.type gpu 2>$null

    Write-Host "Emulator booted and optimized for buttery-smooth performance!" -ForegroundColor Green
} else {
    Write-Host "Active Android device/emulator detected." -ForegroundColor Green
}

Write-Host "Installing FLUX APK ($ApkPath)..." -ForegroundColor Cyan
& $AdbExe install -r $ApkPath

Write-Host "Launching FLUX..." -ForegroundColor Green
& $AdbExe shell am start -n com.shifat.flux/.MainActivity

Write-Host "FLUX is now running on your $AvdName emulator!" -ForegroundColor Green
