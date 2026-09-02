@echo off
REM ===========================================================================
REM  Χρόνης Πέγκας Photography — start a local preview server
REM
REM  DOUBLE-CLICK THIS FILE. No typing, no terminal commands.
REM
REM  It starts a small web server in this folder and opens the site in your
REM  browser. A black window will appear and stay open — that IS the server.
REM  Leave it running while you look at the site, then close it when you are
REM  finished, or press Ctrl+C in it.
REM
REM  This exists because opening index.html directly does NOT show the real
REM  design: the browser treats a file:// page as a foreign origin and blocks
REM  the font files, so the headings silently fall back to Times.
REM ===========================================================================

cd /d "%~dp0"
title Pegkas Photography - local preview

echo.
echo   Chronis Pegkas Photography - local preview
echo   ==========================================
echo.

REM --- Try the Python launcher, then plain python, then Node -----------------
where py >nul 2>nul
if %errorlevel%==0 (
    echo   Starting with Python...
    echo   Opening http://localhost:8000 in your browser.
    echo.
    echo   LEAVE THIS WINDOW OPEN while you look at the site.
    echo   Close it, or press Ctrl+C, when you are done.
    echo.
    start "" http://localhost:8000
    py -m http.server 8000
    goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
    echo   Starting with Python...
    echo   Opening http://localhost:8000 in your browser.
    echo.
    echo   LEAVE THIS WINDOW OPEN while you look at the site.
    echo.
    start "" http://localhost:8000
    python -m http.server 8000
    goto :eof
)

where npx >nul 2>nul
if %errorlevel%==0 (
    echo   Python was not found, using Node instead...
    echo   Opening http://localhost:8000 in your browser.
    echo.
    echo   LEAVE THIS WINDOW OPEN while you look at the site.
    echo.
    start "" http://localhost:8000
    npx --yes serve -l 8000 .
    goto :eof
)

REM --- Nothing available ----------------------------------------------------
echo   Neither Python nor Node is installed on this computer,
echo   so this file cannot start a server.
echo.
echo   Two things you can do instead:
echo.
echo     1. Install Visual Studio Code (free) and its "Live Server"
echo        extension, then right-click index.html in VS Code and choose
echo        "Open with Live Server". No typing required.
echo.
echo     2. Ask Claude for the offline preview file - a single .html that
echo        needs no server at all.
echo.
pause
