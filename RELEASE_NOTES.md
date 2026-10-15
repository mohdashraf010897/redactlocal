# Release Notes — RedactLocal v1.0.2

**Release Date:** October 15, 2026  
**Platforms:** macOS (Apple Silicon & Intel DMG, PKG) · Windows 10 & 11 (64-bit MSI, NSIS EXE) · Web (Air-Gapped PWA)

---

### Highlights & Key Improvements

1. **The 3-Layer Privacy Engine & Standardized Catching Horizon**
   - **Layer 1 (Statutory Core)**: Expanded to 15 national and international statutory formats, adding PAN cards, Aadhaar (UIDAI), corporate GSTIN, TAN, SSN, Passports, IFSC codes, and credit cards.
   - **Layer 2 (On-Device Semantic NER)**: Runs 100% in local memory to identify unstructured patient/doctor names, residential addresses, and clinical medical terms with zero cloud transmission (`connect-src 'none'`).
   - **Layer 3 (Visual Manual Controls)**: Direct canvas click-and-drag box drawing.
   - **Hybrid Fusion Engine**: Deduplicates overlapping targets, preserves statutory priorities, and tracks multi-source audit provenance.

2. **User Discretion & Free-Will Toggle**
   - Users are never forced to redact fields they wish to keep visible (e.g. public court addresses, public firm emails).
   - Toggle any field on/off with checkboxes or by clicking directly on the canvas highlight box.
   - Cryptographic Receipts explicitly distinguish `EXCISED_CLEAN` fields from `KEPT_INTACT_PER_USER_DISCRETION`.

3. **Offline Password Decryption**
   - Decrypt protected filings (Bank Statements, Form 16, AIS/TIS tax forms) 100% offline in local memory without transmitting credentials.
   - Batch Processing Queue features an instant `Unlock 🔑` action.

4. **1-Click Native Desktop Installers**
   - **macOS Disk Image (`.dmg`)**: 18.4 MB with AppleScript visual drag-to-Applications layout.
   - **macOS Package (`.pkg`)**: 18.3 MB for enterprise enterprise deployment.
   - **Windows Installer (`.msi`)**: 8.2 MB official WiX v4 installer for Windows 10/11.
   - **Windows Setup (`.exe`)**: 7.0 MB lightweight NSIS setup.

---

### Direct Download Links

- 🍏 [Download macOS DMG (v1.0.1/v1.0.2)](https://github.com/mohdashraf010897/redactlocal-public/releases/download/v1.0.1/RedactLocal.dmg)
- 🪟 [Download Windows MSI (v1.0.1/v1.0.2)](https://github.com/mohdashraf010897/redactlocal-public/releases/download/v1.0.1/RedactLocal_1.0.0_x64_en-US.msi)
- ⚡ [Download Windows Setup EXE](https://github.com/mohdashraf010897/redactlocal-public/releases/download/v1.0.1/RedactLocal_1.0.0_x64-setup.exe)
- 📦 [Download macOS PKG](https://github.com/mohdashraf010897/redactlocal-public/releases/download/v1.0.1/RedactLocal-Installer.pkg)
