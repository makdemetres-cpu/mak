@echo off
rem FlipDesk - turn off auto-start. (Does not stop a running FlipDesk - use stop.bat for that.)
setlocal
net session >nul 2>&1
if errorlevel 1 (
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
schtasks /delete /tn "FlipDesk" /f
echo.
echo  Auto-start is OFF.
pause
