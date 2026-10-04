@echo off
rem FlipDesk - start everything and open the dashboard.
rem Safe to double-click again: if FlipDesk is already running it just opens the dashboard.
setlocal
cd /d "%~dp0"
set PYTHONUTF8=1
title FlipDesk - starting

rem ---- 1. Python must be installed (python.org, with "Add python.exe to PATH" ticked) ----
python --version >nul 2>&1
if errorlevel 1 (
  echo.
  echo  Python was not found.
  echo  Install it from https://www.python.org/downloads/ and tick
  echo  "Add python.exe to PATH" on the first screen of the installer.
  echo  Then close this window and double-click start.bat again.
  echo.
  pause
  exit /b 1
)

rem ---- 2. First run: create a private Python environment and install the parts ----
if not exist ".venv\Scripts\python.exe" (
  echo  First run: setting up FlipDesk. This takes 1-3 minutes...
  python -m venv .venv
  if errorlevel 1 goto :failed
)
fc /b requirements.txt ".venv\installed-requirements.txt" >nul 2>&1
if errorlevel 1 (
  echo  Installing / updating the parts FlipDesk needs...
  ".venv\Scripts\python.exe" -m pip install --disable-pip-version-check -q -r requirements.txt
  if errorlevel 1 goto :failed
  copy /y requirements.txt ".venv\installed-requirements.txt" >nul
)

rem ---- 3. First run: create your settings files from the examples ----
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo  Created .env - open it with Notepad to add your keys ^(see SETUP-WINDOWS.md^).
)
if not exist "config.yaml" copy "config.example.yaml" "config.yaml" >nul

rem ---- 4. Start in the background (no window) and open the dashboard ----
start "" ".venv\Scripts\pythonw.exe" -m flipbot start
echo  Starting FlipDesk...
".venv\Scripts\python.exe" -m flipbot open
if errorlevel 1 goto :failed
echo.
echo  FlipDesk is running in the background. You can close this window.
echo  To stop it: double-click stop.bat
timeout /t 8 >nul
exit /b 0

:failed
echo.
echo  Something went wrong. Check your internet connection and try again.
echo  Details are in the "logs" folder. 
pause
exit /b 1
