# RedactLocal 🛡️

> **100% Free, Air-Gapped & Open-Source PDF Surgical Redaction & 7-Oracle Verifier**  
> Engineered for litigation paralegals, attorneys, CPAs, healthcare clinics, journalists, and privacy advocates.  
> **100% Free & Open-Source under the MIT License** · Zero Paywall · Zero Subscriptions · Zero Cloud Telemetry.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Air-Gapped](https://img.shields.io/badge/Security-Air--Gapped%20(0%20Bytes%20Network)-10b981.svg)](PRIVACY.md)
[![WebAssembly](https://img.shields.io/badge/Engine-mupdf.js%20Wasm-3b82f6.svg)](./)
[![Compliance](https://img.shields.io/badge/Compliance-FRCP%205.2%20%7C%20HIPAA%20Safe%20Harbor-059669.svg)](./)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support%20Project-yellow.svg)](https://buymeacoffee.com/mohdashraf)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## Why Open Source?

Confidential privacy is a fundamental human right. In an era where corporate software increasingly forces sensitive discovery files into third-party cloud servers, RedactLocal was built so no attorney, doctor, accountant, or citizen is forced to pay $240/year or risk leaking confidential documents.

Every capability in RedactLocal—from native macOS & Windows desktop applications to multi-file batch queues, 7-oracle verifiers, and court-admissible cryptographic receipts—is **100% free and open-source**.

If RedactLocal brings value to your firm or practice, consider [buying us a coffee](https://buymeacoffee.com/mohdashraf) to support ongoing open-source maintenance!

---

## The Problem: The "Black Rectangle Trap"

Most people believe drawing a black rectangle over text in Apple Preview, Microsoft Word, or common PDF tools redacts it. **It does not.** 

Drawing a black box only renders a cosmetic shape on top of the document. The underlying character glyph strings, interactive AcroForm widget values (`/V`), incremental revision histories (`/Prev`), and dynamic XML data packets (`/XFA`) remain intact inside the file. Anyone can highlight the black box, press `Cmd+C`, or use a free text extractor to pull out the secret words.

Major law firms and government agencies have repeatedly suffered public sanctions, court fines, and malpractice suits due to fake visual redactions.

---

## The Solution: True Surgical Redaction

RedactLocal operates completely offline on your device using an air-gapped **WebAssembly engine (`mupdf.js`)**:

1. **Content Stream Surgery**: Permanently eradicates underlying character operators (`Tj`, `TJ`) from content streams.
2. **Interactive Form Scrubbing**: Nullifies AcroForm field values (`/V`, `/DV`) and severs dynamic XML form streams (`/XFA`).
3. **Raster Pixel Burnout**: Overwrites the underlying pixel bytes inside image XObjects (`PDF_REDACT_IMAGE_PIXELS`) for scanned documents.
4. **Clean Serialization**: Rewrites the entire file from scratch (`clean=True, garbage=4`) with zero incremental revision history (`/Prev`).
5. **The 3-Layer Hybrid Fusion Engine**:
   - **Layer 1 (Statutory Determinism)**: 15 statutory formats (SSN, TIN, PAN, Aadhaar, GSTIN, Bank Accounts, Routing Numbers, Credit Cards, Emails, DOBs).
   - **Layer 2 (On-Device Semantic NER)**: Local NLP extracts unstructured patient/doctor names, street addresses, and clinical medical terms.
   - **Layer 3 (Human Discretion)**: Complete user control: toggle any auto field on/off or click and drag custom boxes.
6. **7-Oracle Verification**: Every output is verified against 7 independent automated oracles (including Mozilla PDF.js & pypdf) before delivery, generating an official **Cryptographic Receipt of Redaction (SHA-256)**.

---

## 💻 Installation & Quickstart

### Option 1: 1-Line macOS Terminal Install
Installs RedactLocal directly into `/Applications` and removes Gatekeeper quarantine:
```bash
curl -fsSL https://raw.githubusercontent.com/mohdashraf010897/redactlocal/main/install.sh | bash
```

### Option 2: Direct Installers
- **macOS**: [Download RedactLocal.dmg](https://github.com/mohdashraf010897/redactlocal-public/releases/latest/download/RedactLocal.dmg) or [.pkg Installer](https://github.com/mohdashraf010897/redactlocal-public/releases/latest/download/RedactLocal-Installer.pkg)
- **Windows**: [Download 64-bit MSI Installer](https://github.com/mohdashraf010897/redactlocal-public/releases/download/v1.0.1/RedactLocal_1.0.0_x64_en-US.msi) or [.exe Setup](https://github.com/mohdashraf010897/redactlocal-public/releases/download/v1.0.1/RedactLocal_1.0.0_x64-setup.exe)
- **Windows Package Manager**:
  ```powershell
  winget install RedactLocal
  ```

### Option 3: Run the Web Studio Locally
Zero build step needed! Pure standard HTML5 and WebAssembly:
```bash
git clone https://github.com/mohdashraf010897/redactlocal.git
cd redactlocal
open dist/studio.html
```

---

## 📁 Repository Structure

```
redactlocal/
├── src-macos/               # Native macOS AppKit & WebKit desktop shell (Swift)
├── core/engine/             # Core redaction engine, Wasm loaders & license verifier
├── dist/                    # Static Web App bundle (Single Studio & Batch Queue)
│   ├── index.html           # Public landing page & client-side leak checker
│   ├── studio.html          # Full interactive single & batch redaction studio
│   └── assets/              # Icons, demo video, and static illustrations
├── scripts/                 # Build & validation pipelines
│   ├── build_macos.sh       # Compiles Swift binary, creates .app, .dmg & .pkg
│   ├── build_windows.sh     # Windows installer script
│   ├── validate_packages.py # Package integrity and architecture validator
│   └── test_studio_ux_verification.mjs # Automated Playwright test suite
├── redaction-test-lab/      # 30-document empirical PDF verification lab (Python)
├── redactlocal-deck/        # Motion-deck video composition & render engine (React)
├── CONTRIBUTING.md          # Open-source contributing guidelines
├── LICENSE                  # MIT License
├── PRIVACY.md               # Zero telemetry privacy policy
└── README.md                # Project documentation
```

---

## 🧪 Developer Commands

```bash
# Run automated browser test suite (Playwright)
npm test

# Validate DMG, PKG, and MSI installers
npm run validate

# Build native macOS application and installers
npm run build:macos

# Re-render motion deck 1080p demo video
npm run render:video
```

---

## ☕ Support & Sponsorship

RedactLocal is maintained as a free, independent open-source project. If it has helped your organization, consider:
- **Buying a Coffee**: [buymeacoffee.com/mohdashraf](https://buymeacoffee.com/mohdashraf)
- **GitHub Sponsorship**: [github.com/sponsors/mohdashraf010897](https://github.com/sponsors/mohdashraf010897)
- **Giving us a ⭐** on GitHub!

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

