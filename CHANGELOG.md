# Changelog — RedactLocal

All notable changes to RedactLocal are documented in this file following [Keep a Changelog](https://keepachangelog.com/).

## [1.0.2] - 2026-10-15

### Added
- **3-Layer Hybrid Detection & Fusion Engine**:
  - **Layer 1 (Statutory Core)**: 15 canonical patterns covering PAN cards, Aadhaar (12-digit UIDAI), GSTIN, TAN, SSN, Passports, IFSC codes, Credit Cards, Bank Accounts, Dates of Birth, and Financial Amounts.
  - **Layer 2 (Semantic NER)**: Off-thread background entity classifier (`ner_worker.js`) detecting unstructured patient/doctor names, physical addresses, and clinical diagnoses with zero cloud calls.
  - **Layer 3 (Visual User Bounds)**: Interactive click-and-drag manual box drawing on the canvas.
  - **Hybrid Fusion Engine (`fusion_engine.js`)**: IoU-based bounding box deduplication, statutory tag preservation, and multi-source provenance tracking (`[L1 Statutory]`, `[L2 Semantic]`, `[L3 Manual]`).
- **User Discretion & Free-Will Toggle**:
  - Individual checkboxes per target field with "Select All" / "Deselect All" quick buttons.
  - Canvas bounding boxes toggle between Redact (red) and Keep (dashed grey) on click.
  - Cryptographic Receipts explicitly certify excluded fields as `KEPT_INTACT_PER_USER_DISCRETION` alongside `VERIFIED_ZERO_RESIDUAL_BYTES`.
- **Interactive Offline Password Decryption**:
  - Automated detection of password-encrypted PDFs (Bank Statements, Form 16, AIS/TIS filings).
  - `#password-modal` allows entering the password to decrypt 100% offline in local memory in Studio and Batch Queue (`Unlock 🔑`).
- **Native Windows MSI & NSIS Installers**:
  - Fixed Tauri v2 schema and added `src-tauri/build.rs`.
  - Added direct 1-click downloads for Windows MSI (WiX v4, 8.2 MB) and Windows Setup (NSIS, 7.0 MB).
- **Automated Horizon Test Suite**:
  - Added `tests/pii_horizon_test.mjs` (101/101 assertions passing) and `tests/ner_pipeline_test.mjs` (18/18 assertions passing).

### Changed
- Standardized header action buttons and theme toggle to identical 32px heights and 16px pill radii.
- Rebuilt `RedactLocal.app` and `RedactLocal.dmg` with updated AppleScript visual layout.

---

## [1.0.1] - 2026-10-14

### Added
- Native macOS `WKScriptMessageHandler` and `WKUIDelegate` for local file saving via `NSSavePanel` and universal Finder drag-and-drop.
- Multi-page document support with scale 1.5 rendering and page navigation controls.
- Cryptographic Receipt of Redaction modal with ed25519 signatures.

---

## [1.0.0] - 2026-10-14

### Added
- Initial release of RedactLocal Core Engine: 10-step surgical PDF excision with fail-closed 7-Oracle verification audit.
- Free client-side PWA Leak Triage Checker.
