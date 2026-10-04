@echo off
rem FlipDesk - start automatically when Windows boots (even before you log in),
rem and restart automatically if it ever stops unexpectedly.
rem Windows will ask "Do you want to allow this app to make changes?" - click Yes.
setlocal
cd /d "%~dp0"

net session >nul 2>&1
if errorlevel 1 (
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

if not exist ".venv\Scripts\pythonw.exe" (
  echo  Run start.bat once first, then run this again.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$dir = '%~dp0'.TrimEnd('\');" ^
  "$action = New-ScheduledTaskAction -Execute (Join-Path $dir '.venv\Scripts\pythonw.exe') -Argument '-m flipbot start' -WorkingDirectory $dir;" ^
  "$trigger = New-ScheduledTaskTrigger -AtStartup;" ^
  "$trigger.Delay = 'PT1M';" ^
  "$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Seconds 0) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -MultipleInstances IgnoreNew;" ^
  "$principal = New-ScheduledTaskPrincipal -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType S4U -RunLevel Limited;" ^
  "Register-ScheduledTask -TaskName 'FlipDesk' -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description 'FlipDesk iPhone flipping desk' -Force | Out-Null"
if errorlevel 1 (
  echo.
  echo  Could not set up auto-start. Please send the message above to Claude.
  pause
  exit /b 1
)
echo.
echo  Auto-start is ON. FlipDesk will start about 1 minute after Windows boots,
echo  even before you log in. To turn it off: double-click remove-autostart.bat
echo.
pause
