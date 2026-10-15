#!/usr/bin/env bash
set -e

echo "Building Beautiful DMG with AppleScript layout..."
rm -f build/temp.dmg dist/macos/RedactLocal.dmg
mkdir -p build dist/macos

# 1. Create temporary read-write DMG
hdiutil create -size 35m -fs HFS+ -volname "RedactLocal" -ov build/temp.dmg

# 2. Mount it
MOUNT_DIR="/Volumes/RedactLocal"
if [ -d "${MOUNT_DIR}" ]; then
  hdiutil detach "${MOUNT_DIR}" -force || true
fi

hdiutil attach build/temp.dmg -readwrite -mountpoint "${MOUNT_DIR}"

# 3. Copy app and create Applications symlink
cp -r dist/macos/RedactLocal.app "${MOUNT_DIR}/"
ln -s /Applications "${MOUNT_DIR}/Applications"

# 4. Use AppleScript to set Finder window layout
osascript << 'APPLESCRIPT'
tell application "Finder"
    tell disk "RedactLocal"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set bounds of container window to {300, 200, 940, 620}
        set theViewOptions to ""
        try
            set theViewOptions to icon view options of container window
            set arrangement of theViewOptions to not arranged
            set icon size of theViewOptions to 128
        end try
        try
            set position of item "RedactLocal.app" of container window to {160, 210}
            set position of item "Applications" of container window to {480, 210}
        end try
        close
        open
        delay 2
    end tell
end tell
APPLESCRIPT

# 5. Flush and detach
sync
hdiutil detach "${MOUNT_DIR}" -force

# 6. Convert to compressed UDZO
hdiutil convert build/temp.dmg -format UDZO -imagekey zlib-level=9 -o dist/macos/RedactLocal.dmg -ov
rm -f build/temp.dmg

# 7. Sign DMG
codesign --force --sign - dist/macos/RedactLocal.dmg

echo "✓ Beautiful DMG created at dist/macos/RedactLocal.dmg"
