#!/usr/bin/env bash
set -e

# RedactLocal 1-Line Zero-Friction macOS Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/mohdashraf010897/redactlocal/main/install.sh | bash

echo "=========================================================="
echo " 🍏 RedactLocal — 100% Offline PDF Surgical Redaction"
echo " 100% Free & Open Source · MIT Licensed"
echo "=========================================================="

if [ "$(uname)" != "Darwin" ]; then
  echo "Error: This automated 1-line installer is for macOS only."
  echo "For Windows installers, visit: https://github.com/mohdashraf010897/redactlocal"
  exit 1
fi

TMP_DIR=$(mktemp -d)
trap 'rm -rf "${TMP_DIR}"; hdiutil detach /Volumes/RedactLocal 2>/dev/null || true' EXIT

DMG_URL="https://github.com/mohdashraf010897/redactlocal-public/releases/latest/download/RedactLocal.dmg"

echo "→ [1/4] Downloading latest RedactLocal release..."
curl -fSL "${DMG_URL}" -o "${TMP_DIR}/RedactLocal.dmg" --progress-bar

echo "→ [2/4] Mounting disk image..."
hdiutil detach /Volumes/RedactLocal 2>/dev/null || true
hdiutil attach "${TMP_DIR}/RedactLocal.dmg" -nobrowse -quiet -mountpoint /Volumes/RedactLocal

echo "→ [3/4] Installing RedactLocal into /Applications..."
rm -rf /Applications/RedactLocal.app
cp -R /Volumes/RedactLocal/RedactLocal.app /Applications/

hdiutil detach /Volumes/RedactLocal -quiet -force || true

echo "→ [4/4] Removing Gatekeeper download quarantine..."
xattr -cr /Applications/RedactLocal.app

echo "=========================================================="
echo " ✓ RedactLocal successfully installed into /Applications!"
echo " Launching RedactLocal..."
echo "=========================================================="
open /Applications/RedactLocal.app
