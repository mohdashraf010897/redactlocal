# RedactLocal 🛡️

> **100% Free, Offline & Open-Source PDF Visual Redaction & Leak Checker**  
> Engineered for litigation paralegals, attorneys, CPAs, healthcare clinics, journalists, and privacy advocates.  
> **100% Free & Open-Source under the MIT License** · Zero Paywall · Zero Subscriptions · Zero Cloud Telemetry.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Air-Gapped](https://img.shields.io/badge/Security-Air--Gapped%20(0%20Bytes%20Network)-10b981.svg)](PRIVACY.md)
[![Engine](https://img.shields.io/badge/Engine-pdf.js%20%2B%20Canvas%20Flattening-3b82f6.svg)](./)
[![Assists](https://img.shields.io/badge/Assists-FRCP%205.2%20%7C%20Privacy%20Rules-059669.svg)](./)
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

## The Solution: True Visual Flattening Redaction

RedactLocal operates completely offline on your device using a client-side **Secure Visual Flattening Engine (Mozilla pdf.js + Canvas)**:

1. **Permanent Vector Text Destruction**: Pages are rendered to high-resolution canvases where blackouts are burned permanently into the pixel grid. The original vector character streams, font tables, and text layers are physically excluded from the generated PDF.
2. **Form & Interactive Layer Strip**: Generates fresh PDF document objects from scratch, completely omitting original AcroForm `/V` values, dynamic `/XFA` streams, and annotations.
3. **Clean Metadata Sanitization**: Document information dictionaries (`/Info`), creator strings, and embedded `/XMP` packets are stripped in the output file.
4. **Pattern-Based Sensitivity Detection**: Automatically flags 15+ statutory and sensitive patterns (SSNs, TINs, PANs, Aadhaar, GSTIN, Bank Accounts, Credit Cards, Emails, DOBs, phone numbers).
5. **Human Review & Custom Bounding Boxes**: Full user control: toggle any detected term on/off or click and drag custom blackout boxes.
6. **Local Audit Log (Unsigned)**: Generates a transparent JSON audit manifest documenting input/output SHA-256 hashes, timestamps, and redaction coordinates.

---

## ⚖️ What RedactLocal Does & Does Not Do

**What RedactLocal Does:** Processes PDFs 100% locally in your browser or desktop sandbox with zero server uploads. It detects sensitive patterns, renders blackouts directly onto the canvas, and exports a fresh, flattened PDF. This permanently destroys underlying text layers, invisible metadata, and ghost text.

**What RedactLocal Does Not Do:** It does not use remote cloud AI or legal compliance warranties. Pattern detection is heuristic and cannot replace manual legal review. Scanned pages without text layers require manual box placement. Flattened PDFs do not preserve selectable text.

---

## ⚠️ Known Limitations
1. **Detection is heuristic**: Automated pattern matching can miss or over-match terms; human review of every page is required before sharing.
2. **Flattened raster output**: The output PDF is composed of high-resolution images; text is not selectable or searchable.
3. **Scanned/image-only PDFs**: Pages without text streams produce no automated detections; redact them by drawing manual boxes.
4. **No compliance certification**: Using RedactLocal does not certify compliance with FRCP 5.2, HIPAA Safe Harbor, or IRS rules; you remain responsible for your filings.
5. **Unsigned local audit logs**: Audit logs record file hashes and bounding boxes locally; they are unsigned and do not constitute legal proof.

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

