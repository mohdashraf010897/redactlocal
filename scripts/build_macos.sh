#!/usr/bin/env bash
set -e

# scripts/build_macos.sh - Build Native RedactLocal.app and RedactLocal.dmg
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
rm -rf "${BUILD_DIR}"
mkdir -p "${MACOS_DIR}" "${RESOURCES}" "${RESOURCES}/dist"

# 2. Compile Swift binary with AppKit & WebKit
echo "[1/4] Compiling native Swift binary..."
swiftc -O -framework Cocoa -framework WebKit \
  src-macos/main.swift \
  -o "${MACOS_DIR}/${APP_NAME}"

chmod +x "${MACOS_DIR}/${APP_NAME}"
echo "  ✓ Compiled binary: ${MACOS_DIR}/${APP_NAME}"

# 3. Create Info.plist
echo "[2/4] Generating Info.plist..."
cat << 'EOF' > "${CONTENTS}/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>RedactLocal</string>
    <key>CFBundleIdentifier</key>
    <string>com.mohdashraf.redactlocal</string>
    <key>CFBundleName</key>
    <string>RedactLocal</string>
    <key>CFBundleDisplayName</key>
    <string>RedactLocal</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
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

# 4. Copy production web & wasm assets into app bundle
echo "[3/4] Packaging embedded studio and Wasm assets..."
cp -r dist/* "${RESOURCES}/dist/"
cp leak-checker/icon.svg "${RESOURCES}/icon.svg"

# Copy app bundle to dist and root
mkdir -p dist/macos
cp -r "${APP_BUNDLE}" dist/macos/
echo "  ✓ Native app bundle ready at: dist/macos/RedactLocal.app"

# 5. Create DMG installer image
echo "[4/4] Creating macOS DMG installer (RedactLocal.dmg)..."
DMG_PATH="dist/macos/RedactLocal.dmg"
rm -f "${DMG_PATH}"

# Create staging directory for DMG
DMG_STAGING="build/dmg_staging"
rm -rf "${DMG_STAGING}"
mkdir -p "${DMG_STAGING}"
cp -r "${APP_BUNDLE}" "${DMG_STAGING}/"
ln -s /Applications "${DMG_STAGING}/Applications"

hdiutil create -volname "RedactLocal" \
  -srcfolder "${DMG_STAGING}" \
  -ov -format UDZO \
  "${DMG_PATH}" >/dev/null

rm -rf "${DMG_STAGING}"

echo "=========================================================="
echo " ✓ Build Successful!"
echo " Native Application: dist/macos/RedactLocal.app"
echo " macOS Installer:    dist/macos/RedactLocal.dmg"
echo " File size:          $(du -sh "${DMG_PATH}" | cut -f1)"
echo "=========================================================="
