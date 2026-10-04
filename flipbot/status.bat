@echo off
rem FlipDesk - is it running?
setlocal
cd /d "%~dp0"
set PYTHONUTF8=1
title FlipDesk - status
if not exist ".venv\Scripts\python.exe" (
  echo  FlipDesk is not installed yet - run start.bat first.
  pause
  exit /b 1
)
".venv\Scripts\python.exe" -m flipbot status
schtasks /query /tn "FlipDesk" >nul 2>&1
if errorlevel 1 (
  echo   Auto-start: OFF  ^(double-click install-autostart.bat to turn it on^)
) else (
  echo   Auto-start: ON   ^(starts when Windows boots^)
)
echo.
pause
