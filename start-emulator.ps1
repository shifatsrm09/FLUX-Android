# Script to launch Android Emulator standalone without FLUX
$ErrorActionPreference = "Stop"

$SdkDir = "C:\Users\shifa\AppData\Local\Android\Sdk"
$EmulatorExe = "$SdkDir\emulator\emulator.exe"
$AdbExe = "$SdkDir\platform-tools\adb.exe"

Write-Host "Checking for running Android devices/emulators..." -ForegroundColor Cyan
$devices = & $AdbExe devices | Where-Object { $_ -match "\bdevice\b" }

if (-not $devices) {
    Write-Host "Starting 'Medium_Phone' AVD..." -ForegroundColor Green
    $emuArgs = @(
        "-avd", "Medium_Phone",
        "-no-boot-anim"
    )
    Start-Process -FilePath $EmulatorExe -ArgumentList $emuArgs
    
    Write-Host "Waiting for emulator to boot up..." -ForegroundColor Yellow
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
    & $AdbExe shell settings put global window_animation_scale 0.75 2>$null
    & $AdbExe shell settings put global transition_animation_scale 0.75 2>$null
    & $AdbExe shell settings put global animator_duration_scale 0.75 2>$null
    & $AdbExe shell setprop debug.sf.hw 1 2>$null
    & $AdbExe shell setprop debug.egl.hw 1 2>$null
    & $AdbExe shell setprop debug.composition.type gpu 2>$null

    Write-Host "Android Emulator is ready to use!" -ForegroundColor Green
} else {
    Write-Host "Android emulator is already running." -ForegroundColor Green
}
