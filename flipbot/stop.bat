@echo off
rem FlipDesk - stop the bot (and its watchdog) cleanly.
setlocal
cd /d "%~dp0"
set PYTHONUTF8=1
title FlipDesk - stopping
if not exist ".venv\Scripts\python.exe" (
  echo  FlipDesk is not installed yet - run start.bat first.
  pause
  exit /b 1
)
".venv\Scripts\python.exe" -m flipbot stop
echo  It will start again by itself at the next Windows start-up if auto-start is on.
timeout /t 6 >nul
