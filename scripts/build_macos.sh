#!/usr/bin/env bash
set -e

# scripts/build_macos.sh - Build Production Native RedactLocal.app, RedactLocal.dmg & .pkg
echo "=========================================================="
echo " Building Native macOS Application: RedactLocal.app"
echo "=========================================================="

APP_NAME="RedactLocal"
BUILD_DIR="build/macos"
APP_BUNDLE="${BUILD_DIR}/${APP_NAME}.app"
CONTENTS="${APP_BUNDLE}/Contents"
MACOS_DIR="${CONTENTS}/MacOS"
RESOURCES="${CONTENTS}/Resources"

# 1. Clean & create directory layout
rm -rf "${BUILD_DIR}" build/dmg_staging
mkdir -p "${MACOS_DIR}" "${RESOURCES}" "${RESOURCES}/dist"

# 2. Compile Swift binary with AppKit & WebKit
echo "[1/6] Compiling native Swift binary..."
swiftc -O -framework Cocoa -framework WebKit \
  src-macos/main.swift \
  -o "${MACOS_DIR}/${APP_NAME}"

chmod +x "${MACOS_DIR}/${APP_NAME}"
echo "  ✓ Compiled binary: ${MACOS_DIR}/${APP_NAME}"

# 3. Create Info.plist with icon and bundle metadata
echo "[2/6] Generating Info.plist..."
cat << 'EOF' > "${CONTENTS}/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>RedactLocal</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIconName</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.mohdashraf010897.redactlocal</string>
    <key>CFBundleName</key>
    <string>RedactLocal</string>
    <key>CFBundleDisplayName</key>
    <string>RedactLocal</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>11.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2026 Mohd Ashraf. 100% Offline Air-Gapped.</string>
    <key>CFBundleDocumentTypes</key>
    <array>
        <dict>
            <key>CFBundleTypeName</key>
            <string>PDF Document</string>
            <key>CFBundleTypeRole</key>
            <string>Editor</string>
            <key>LSHandlerRank</key>
            <string>Alternate</string>
            <key>LSItemContentTypes</key>
            <array>
                <string>com.adobe.pdf</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
EOF

# 4. Copy app icon and web assets (EXCLUDING dist/macos to prevent recursive bloat)
echo "[3/6] Packaging AppIcon and web assets..."
if [ -f "src-macos/AppIcon.icns" ]; then
  cp "src-macos/AppIcon.icns" "${RESOURCES}/AppIcon.icns"
fi

# Copy web dist assets excluding macos subdirectory
rsync -av --exclude="macos" dist/ "${RESOURCES}/dist/" >/dev/null
cp leak-checker/icon.svg "${RESOURCES}/icon.svg"

# 5. Clean detritus and code-sign bundle
echo "[4/6] Stripping extended attributes and signing bundle..."
find "${APP_BUNDLE}" -name ".DS_Store" -delete
xattr -cr "${APP_BUNDLE}"

SIGNING_IDENTITY="Apple Development: Mohd Ashraf (5CHUK9GBG3)"
if [ "${USE_ADHOC:-0}" = "1" ]; then
  echo "  ✓ Signing bundle with ad-hoc signature"
  codesign --force --deep --sign - "${APP_BUNDLE}"
elif security find-identity -v -p codesigning | grep -q "${SIGNING_IDENTITY}"; then
  echo "  ✓ Signing bundle with identity: ${SIGNING_IDENTITY}"
  if ! codesign --force --deep --options runtime --sign "${SIGNING_IDENTITY}" "${APP_BUNDLE}" 2>/dev/null; then
    echo "  ⚠ Identity access prompted or failed; falling back to ad-hoc signature"
    codesign --force --deep --sign - "${APP_BUNDLE}"
  fi
else
  echo "  ✓ Signing bundle with ad-hoc signature"
  codesign --force --deep --sign - "${APP_BUNDLE}"
fi

# Verify strict signature
codesign -v --deep --strict "${APP_BUNDLE}"
echo "  ✓ Code signature verified successfully!"

# Copy app bundle to dist/macos
mkdir -p dist/macos
rm -rf dist/macos/RedactLocal.app
cp -r "${APP_BUNDLE}" dist/macos/
echo "  ✓ Native app bundle ready at: dist/macos/RedactLocal.app"

# 6. Create DMG installer image
echo "[5/6] Creating macOS DMG installer (RedactLocal.dmg)..."
DMG_PATH="dist/macos/RedactLocal.dmg"
rm -f "${DMG_PATH}"

DMG_STAGING="build/dmg_staging"
rm -rf "${DMG_STAGING}"
mkdir -p "${DMG_STAGING}"
cp -r "${APP_BUNDLE}" "${DMG_STAGING}/"
ln -s /Applications "${DMG_STAGING}/Applications"

# Add friendly install instructions in DMG
cat << 'EOF' > "${DMG_STAGING}/INSTALL_INSTRUCTIONS.txt"
============================================================
 RedactLocal — 100% Offline PDF Redaction & 7-Oracle Verifier
============================================================

INSTALLATION:
1. Drag the "RedactLocal" application icon into "Applications".
2. Open RedactLocal from your Applications folder or Spotlight.

FIRST-TIME OPEN ON MACOS (Gatekeeper):
Because RedactLocal is an air-gapped utility built with 100%
offline privacy (zero server telemetry):
- If macOS shows "cannot be opened because developer cannot be verified":
  1. Open System Settings → Privacy & Security.
  2. Scroll down to Security and click "Open Anyway".
  (Or in Terminal: xattr -cr /Applications/RedactLocal.app)

Enjoy 100% deterministic, private PDF redaction!
============================================================
EOF

xattr -cr "${DMG_STAGING}"

hdiutil create -volname "RedactLocal" \
  -srcfolder "${DMG_STAGING}" \
  -ov -format UDZO \
  "${DMG_PATH}" >/dev/null

codesign --force --sign - "${DMG_PATH}" || true
rm -rf "${DMG_STAGING}"

# 7. Create PKG Installer
echo "[6/6] Creating macOS PKG installer (RedactLocal-Installer.pkg)..."
PKG_PATH="dist/macos/RedactLocal-Installer.pkg"
rm -f "${PKG_PATH}"

pkgbuild --component "${APP_BUNDLE}" \
  --install-location "/Applications" \
  "${PKG_PATH}" >/dev/null

echo "=========================================================="
echo " ✓ Build Successful!"
echo " Native Application: dist/macos/RedactLocal.app"
echo " macOS Disk Image:   dist/macos/RedactLocal.dmg ($(du -sh "${DMG_PATH}" | cut -f1))"
echo " macOS PKG Package:  dist/macos/RedactLocal-Installer.pkg ($(du -sh "${PKG_PATH}" | cut -f1))"
echo "=========================================================="
