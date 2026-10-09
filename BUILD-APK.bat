@echo off
REM ============================================================================
REM  Forte Options - Build the installable Android APK (preview build)
REM  Just DOUBLE-CLICK this file. Follow the on-screen prompts.
REM ============================================================================
setlocal

cd /d "%~dp0mobile"

echo.
echo ============================================================
echo   FORTE OPTIONS  -  ANDROID APK BUILDER
echo ============================================================
echo.
echo This will build an installable .apk file on Expo's servers.
echo You do NOT need Android Studio or Java installed.
echo.

REM 1. Make sure Node.js is available
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found on this computer.
  echo Please install the "LTS" version from https://nodejs.org then run this again.
  pause
  exit /b 1
)

REM 2. Install the app's dependencies (safe to re-run)
echo [1/4] Installing app dependencies... this can take a few minutes the first time.
call npm install
if errorlevel 1 (
  echo [ERROR] Dependency install failed. See the message above.
  pause
  exit /b 1
)

REM 3. Make sure the Expo build tool is available
echo [2/4] Checking the Expo build tool...
call npx --yes eas-cli@latest --version
if errorlevel 1 (
  echo [ERROR] Could not run the Expo build tool. Check your internet connection.
  pause
  exit /b 1
)

REM 4. Log in to your Expo account (only needed once per computer)
echo [3/4] Sign in to Expo.
echo        - If you already logged in on this computer, this is skipped.
echo        - If asked, sign in with your free Expo account ^(expo.dev^).
call npx --yes eas-cli@latest whoami >nul 2>nul
if errorlevel 1 (
  call npx --yes eas-cli@latest login
  if errorlevel 1 (
    echo [ERROR] Expo login failed.
    pause
    exit /b 1
  )
) else (
  echo        Already signed in. Continuing...
)

REM 5. Build the APK
echo [4/4] Starting the cloud build. This usually takes 10-20 minutes.
echo        When it finishes, a download link for the .apk is printed below
echo        and saved to your Expo account dashboard.
echo.
call npx --yes eas-cli@latest build --platform android --profile preview --non-interactive
if errorlevel 1 (
  echo.
  echo [ERROR] The build did not finish. Scroll up to read the reason.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo   DONE! Copy the "APK" download link above and upload it
echo   to Google Drive for your submission.
echo ============================================================
echo.
pause
