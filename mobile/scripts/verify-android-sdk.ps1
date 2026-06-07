# Verify Android SDK / adb for Marvel Rocks mobile emulator testing.
# Run after installing Android Studio and setting ANDROID_HOME.

$sdk = $env:ANDROID_HOME
if (-not $sdk) { $sdk = $env:ANDROID_SDK_ROOT }
if (-not $sdk) { $sdk = "$env:LOCALAPPDATA\Android\Sdk" }

Write-Host "Checking Android SDK at: $sdk"

if (-not (Test-Path $sdk)) {
    Write-Host "SDK folder not found. Install Android Studio first:" -ForegroundColor Red
    Write-Host "  https://developer.android.com/studio"
    exit 1
}

$adb = Join-Path $sdk "platform-tools\adb.exe"
$emulator = Join-Path $sdk "emulator\emulator.exe"

if (Test-Path $adb) {
    Write-Host "adb:" -ForegroundColor Green
    & $adb version
} else {
    Write-Host "adb not found. In Android Studio SDK Manager, install 'Android SDK Platform-Tools'." -ForegroundColor Red
}

if (Test-Path $emulator) {
    Write-Host "emulator: OK" -ForegroundColor Green
    Write-Host "Available AVDs:"
    & $emulator -list-avds
} else {
    Write-Host "emulator not found. Install 'Android Emulator' in SDK Manager." -ForegroundColor Red
}

if (Test-Path $adb) {
    Write-Host "Connected devices:"
    & $adb devices
}

Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Start emulator from Android Studio -> Device Manager"
Write-Host "  2. cd mobile"
Write-Host "  3. npx expo start -c"
Write-Host "  4. Press 'a' to open on Android emulator (Expo Go must be on emulator)"
