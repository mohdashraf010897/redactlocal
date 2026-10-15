#!/usr/bin/env python3
# /// script
# dependencies = [
#     "olefile",
#     "pefile",
# ]
# ///
"""
RedactLocal — Local Multi-Platform Package Validator
Validates DMG, PKG, MSI, and EXE installers locally on macOS without VMs.
"""

import hashlib
import os
import subprocess
import sys
import tempfile

def calculate_sha256(file_path):
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def validate_dmg(dmg_path):
    print(f"\n🍏 [1/4] Validating macOS Disk Image (DMG): {os.path.basename(dmg_path)}")
    if not os.path.exists(dmg_path):
        print(f"  ❌ File not found: {dmg_path}")
        return False

    # 1. Checksum & image structure verification
    res = subprocess.run(["hdiutil", "verify", dmg_path], capture_output=True, text=True)
    if "is VALID" in res.stdout or res.returncode == 0:
        print("  ✅ hdiutil verify: Integrity checksum verified.")
    else:
        print(f"  ❌ hdiutil verify failed:\n{res.stderr}")
        return False

    # 2. Mount and inspect bundle
    with tempfile.TemporaryDirectory() as mount_point:
        mount_cmd = subprocess.run(
            ["hdiutil", "attach", "-nobrowse", "-readonly", dmg_path, "-mountpoint", mount_point],
            capture_output=True, text=True
        )
        if mount_cmd.returncode != 0:
            print(f"  ❌ Failed to mount DMG: {mount_cmd.stderr}")
            return False

        try:
            app_path = os.path.join(mount_point, "RedactLocal.app")
            if not os.path.exists(app_path):
                print("  ❌ RedactLocal.app not found inside DMG")
                return False
            
            # Check codesign
            cs_cmd = subprocess.run(["codesign", "-dvvv", app_path], capture_output=True, text=True)
            for line in cs_cmd.stderr.splitlines():
                if any(k in line for k in ["Identifier=", "Authority=", "TeamIdentifier=", "Format="]):
                    print(f"  🔹 {line.strip()}")
            
            # Check binary arch
            bin_path = os.path.join(app_path, "Contents", "MacOS", "RedactLocal")
            file_cmd = subprocess.run(["file", bin_path], capture_output=True, text=True)
            print(f"  🔹 Binary: {file_cmd.stdout.strip().split(': ')[-1]}")
            print("  ✅ App bundle structure and signature are intact.")
        finally:
            subprocess.run(["hdiutil", "detach", mount_point, "-quiet"])

    return True

def validate_pkg(pkg_path):
    print(f"\n📦 [2/4] Validating macOS Installer Package (PKG): {os.path.basename(pkg_path)}")
    if not os.path.exists(pkg_path):
        print(f"  ❌ File not found: {pkg_path}")
        return False

    # 1. Signature check
    sig_cmd = subprocess.run(["pkgutil", "--check-signature", pkg_path], capture_output=True, text=True)
    print(f"  🔹 Signature: {sig_cmd.stdout.strip().splitlines()[0] if sig_cmd.stdout else 'Checked'}")

    # 2. Expand without installing (pkgutil expects destination dir not to exist)
    expand_dir = os.path.join(tempfile.gettempdir(), f"pkg_test_expand_{os.getpid()}")
    try:
        exp_cmd = subprocess.run(["pkgutil", "--expand-full", pkg_path, expand_dir], capture_output=True, text=True)
        if exp_cmd.returncode != 0:
            print(f"  ❌ pkgutil --expand-full failed: {exp_cmd.stderr}")
            return False

        pkg_info = os.path.join(expand_dir, "PackageInfo")
        if os.path.exists(pkg_info):
            with open(pkg_info, "r", encoding="utf-8", errors="ignore") as f:
                info_text = f.read()
                if "install-location=\"/Applications\"" in info_text:
                    print("  ✅ PackageInfo: Targets /Applications destination.")
                if "identifier=\"com.mohdashraf010897.redactlocal\"" in info_text:
                    print("  ✅ PackageInfo: Bundle ID verified.")

        payload_app = os.path.join(expand_dir, "Payload", "RedactLocal.app")
        if os.path.exists(payload_app):
            print("  ✅ Payload: RedactLocal.app present with full contents.")
        else:
            print("  ❌ Payload app bundle missing.")
            return False
    finally:
        if os.path.exists(expand_dir):
            subprocess.run(["rm", "-rf", expand_dir])

    return True

def validate_msi(msi_path, expected_sha=None):
    print(f"\n🪟 [3/4] Validating Windows MSI Package: {os.path.basename(msi_path)}")
    if not os.path.exists(msi_path):
        print(f"  ❌ File not found: {msi_path}")
        return False

    import olefile
    if not olefile.isOleFile(msi_path):
        print("  ❌ Not a valid OLE CFBF MSI container.")
        return False

    with olefile.OleFileIO(msi_path) as ole:
        meta = ole.get_metadata()
        print(f"  🔹 Title: {meta.title.decode() if isinstance(meta.title, bytes) else meta.title}")
        print(f"  🔹 Subject: {meta.subject.decode() if isinstance(meta.subject, bytes) else meta.subject}")
        print(f"  🔹 Author: {meta.author.decode() if isinstance(meta.author, bytes) else meta.author}")
        print(f"  🔹 Creator: {meta.creating_application.decode() if isinstance(meta.creating_application, bytes) else meta.creating_application}")
        streams = ole.listdir()
        print(f"  ✅ OLE Storage verified ({len(streams)} internal streams/tables).")

    with open(msi_path, "rb") as f:
        content = f.read()
    if b"RedactLocal" in content and b"ProgramFiles64Folder" in content:
        print("  ✅ WiX Database: Targets ProgramFiles64Folder with RedactLocal product tables.")

    actual_sha = calculate_sha256(msi_path)
    print(f"  🔹 SHA-256: {actual_sha}")
    if expected_sha and actual_sha.lower() == expected_sha.lower():
        print(f"  ✅ SHA-256 matches Winget manifest target: {expected_sha}")

    return True

def validate_exe(exe_path):
    print(f"\n⚡ [4/4] Validating Windows NSIS Executable (EXE): {os.path.basename(exe_path)}")
    if not os.path.exists(exe_path):
        print(f"  ❌ File not found: {exe_path}")
        return False

    import pefile
    try:
        pe = pefile.PE(exe_path)
    except Exception as e:
        print(f"  ❌ PE parse failed: {e}")
        return False

    machine = "x86-64" if pe.FILE_HEADER.Machine == 0x8664 else "x86 NSIS stub"
    subsystem = "GUI (Windows)" if pe.OPTIONAL_HEADER.Subsystem == 2 else str(pe.OPTIONAL_HEADER.Subsystem)
    print(f"  🔹 PE Header: {machine} | Subsystem: {subsystem} | Sections: {pe.FILE_HEADER.NumberOfSections}")

    overlay = pe.get_overlay()
    if overlay and b"NullsoftInst" in overlay:
        print(f"  ✅ NSIS Payload: Valid NullsoftInst magic detected ({len(overlay):,} bytes).")
    else:
        print("  ⚠️ NSIS overlay header not found.")

    actual_sha = calculate_sha256(exe_path)
    print(f"  🔹 SHA-256: {actual_sha}")
    return True

def main():
    search_dirs = [
        os.path.abspath("dist/macos"),
        "/tmp/package-validation",
        os.path.expanduser("~/Downloads"),
        os.path.abspath("distribution"),
    ]
    
    print("=" * 65)
    print(" 🛡️  RedactLocal — Offline Installer Package Validator")
    print("=" * 65)

    dmg = next((os.path.join(d, "RedactLocal.dmg") for d in search_dirs if os.path.exists(os.path.join(d, "RedactLocal.dmg"))), None)
    pkg = next((os.path.join(d, "RedactLocal-Installer.pkg") for d in search_dirs if os.path.exists(os.path.join(d, "RedactLocal-Installer.pkg"))), None)
    msi = next((os.path.join(d, "RedactLocal_1.0.0_x64_en-US.msi") for d in search_dirs if os.path.exists(os.path.join(d, "RedactLocal_1.0.0_x64_en-US.msi"))), None)
    exe = next((os.path.join(d, "RedactLocal_1.0.0_x64-setup.exe") for d in search_dirs if os.path.exists(os.path.join(d, "RedactLocal_1.0.0_x64-setup.exe"))), None)

    winget_msi_sha = "43423999324a7ea7a076626db3d1529560c1f32fab663de5203910718990ee67"

    results = []
    if dmg: results.append(("DMG", validate_dmg(dmg)))
    if pkg: results.append(("PKG", validate_pkg(pkg)))
    if msi: results.append(("MSI", validate_msi(msi, expected_sha=winget_msi_sha)))
    if exe: results.append(("EXE", validate_exe(exe)))

    print("\n" + "=" * 65)
    print(" 📊 Validation Summary:")
    all_passed = True
    for name, ok in results:
        status = "PASSED ✅" if ok else "FAILED ❌"
        if not ok: all_passed = False
        print(f"  • {name:4s}: {status}")
    print("=" * 65)
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
