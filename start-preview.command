#!/bin/bash
# ============================================================================
#  Χρόνης Πέγκας Photography — start a local preview server (macOS)
#
#  DOUBLE-CLICK THIS FILE. No typing, no terminal commands.
#
#  A Terminal window opens and stays open — that IS the server. Leave it
#  running while you look at the site, then close it or press Ctrl+C.
#
#  If macOS refuses to open it the first time, right-click the file and
#  choose Open, then confirm. That only has to be done once.
#
#  This exists because opening index.html directly does NOT show the real
#  design: the browser treats a file:// page as a foreign origin and blocks
#  the font files, so the headings silently fall back to Times.
# ============================================================================
cd "$(dirname "$0")" || exit 1

echo
echo "  Chronis Pegkas Photography — local preview"
echo "  =========================================="
echo

if command -v python3 >/dev/null 2>&1; then
  echo "  Opening http://localhost:8000 in your browser."
  echo "  LEAVE THIS WINDOW OPEN while you look at the site."
  echo
  (sleep 1; open http://localhost:8000) &
  python3 -m http.server 8000
elif command -v npx >/dev/null 2>&1; then
  echo "  Python not found, using Node instead."
  echo "  Opening http://localhost:8000 in your browser."
  echo
  (sleep 2; open http://localhost:8000) &
  npx --yes serve -l 8000 .
else
  echo "  Neither Python nor Node is installed, so this cannot start a server."
  echo
  echo "  Install Visual Studio Code (free) and its \"Live Server\" extension,"
  echo "  then right-click index.html in VS Code and choose Open with Live Server."
  echo
  read -r -p "  Press Enter to close." _
fi
