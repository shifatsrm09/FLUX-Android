$msJdk = Get-ChildItem "C:\Program Files\Microsoft" -Filter "jdk-21*" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
if ($msJdk -and (Test-Path $msJdk)) {
    $env:JAVA_HOME = $msJdk
} elseif (-not $env:JAVA_HOME -or -not (Test-Path $env:JAVA_HOME)) {
    if (Test-Path "C:\Program Files\Android\Android Studio\jbr") {
        $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
    } elseif (Test-Path "C:\Users\shifa\.jdk\jdk-21.0.12.1+1") {
        $env:JAVA_HOME = "C:\Users\shifa\.jdk\jdk-21.0.12.1+1"
    }
}
if (-not $env:ANDROID_HOME -or -not (Test-Path $env:ANDROID_HOME)) {
    if (Test-Path "$env:LOCALAPPDATA\Android\Sdk") {
        $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
    } elseif (Test-Path "C:\Users\shifa\AppData\Local\Android\Sdk") {
        $env:ANDROID_HOME = "C:\Users\shifa\AppData\Local\Android\Sdk"
    }
}
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

Write-Host "Building web assets..." -ForegroundColor Cyan
npm.cmd run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Syncing with Capacitor Android..." -ForegroundColor Cyan
npx.cmd cap sync android
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Compiling Android Debug APK..." -ForegroundColor Cyan
Set-Location android
.\gradlew.bat assembleDebug
$gradleStatus = $LASTEXITCODE
Set-Location ..

if ($gradleStatus -eq 0) {
    Copy-Item -Path "android/app/build/outputs/apk/debug/app-debug.apk" -Destination "FLUX-Android.apk" -Force
    Write-Host "SUCCESS: APK generated at FLUX-Android.apk" -ForegroundColor Green
} else {
    Write-Host "Gradle build failed with code $gradleStatus" -ForegroundColor Red
    exit $gradleStatus
}
