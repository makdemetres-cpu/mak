@echo off
setlocal
cd /d "%~dp0"
title Crypto Paper Trader

call :find_uv
if errorlevel 1 exit /b 1

if not exist ".env" copy ".env.example" ".env" >nul

uv run --no-dev python -m server
if errorlevel 1 pause
exit /b

:find_uv
where uv >nul 2>nul
if not errorlevel 1 exit /b 0
if exist "%USERPROFILE%\.local\bin\uv.exe" (
  set "PATH=%USERPROFILE%\.local\bin;%PATH%"
  exit /b 0
)
echo First run: installing uv, the free tool that sets up Python for this app.
echo This happens once and takes about a minute.
powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://astral.sh/uv/install.ps1 | iex"
set "PATH=%USERPROFILE%\.local\bin;%PATH%"
where uv >nul 2>nul
if errorlevel 1 (
  echo.
  echo Could not install uv. See "If something goes wrong" in README.md.
  pause
  exit /b 1
)
exit /b 0
