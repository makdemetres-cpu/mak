# Registers FlipDesk to start at logon and restart on failure. Run in PowerShell from the flipbot folder.
$dir = (Get-Location).Path
$action = New-ScheduledTaskAction -Execute "python.exe" -Argument "-m flipbot start" -WorkingDirectory $dir
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit (New-TimeSpan -Days 0) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "FlipDesk" -Action $action -Trigger $trigger -Settings $settings -Force
