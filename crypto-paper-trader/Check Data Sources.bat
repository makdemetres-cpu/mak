@echo off
setlocal
cd /d "%~dp0"
title Crypto Paper Trader - check data sources

where uv >nul 2>nul
if errorlevel 1 set "PATH=%USERPROFILE%\.local\bin;%PATH%"
where uv >nul 2>nul
if errorlevel 1 (
  echo Run "Start Crypto Paper Trader.bat" once first. It installs what this check needs.
  pause
  exit /b 1
)

if not exist ".env" copy ".env.example" ".env" >nul
uv run --no-dev python -m server.check
pause
