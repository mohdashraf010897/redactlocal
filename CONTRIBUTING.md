# Contributing to RedactLocal 🛡️

Thank you for your interest in contributing to **RedactLocal**! RedactLocal is an open-source, air-gapped PDF surgical redaction utility and 7-oracle verification engine.

Our mission is simple: **Confidential privacy is a fundamental human right.** Legal teams, accounting practices, healthcare clinics, journalists, and everyday citizens should never have to pay $240/year or risk leaking confidential documents to corporate cloud servers.

---

## 🏛️ Non-Negotiable Core Invariants

Before writing code or opening a PR, all contributors must uphold our core security invariants:

1. **Air-Gapped Isolation (`connect-src 'none'`)**:
   - Zero network transmission. No analytics, no crash reporting, no external CDN dependencies, and no phone-home telemetry.
   - Every parsing, OCR, semantic extraction, and PDF reconstruction step must run on the user's local device.
2. **True Bytecode Stream Surgery**:
   - RedactLocal is **not** a cosmetic blackout tool. Drawing black boxes over text while leaving character strings in the stream is considered a critical security failure.
   - All target bytes, AcroForm `/V` values, `/XFA` datasets, `/Prev` revision history, and underlying raster pixels must be irreversibly eradicated.
3. **Fail-Closed 7-Oracle Verification**:
   - If a document cannot be parsed cleanly, has encrypted layers without credentials, or fails any verification oracle, the engine must fail closed rather than risk a silent leak.
4. **Human Discretion & Free Will**:
   - Statutory algorithms assist the user, but the user always retains ultimate control to include, exclude, or manually define bounding boxes.

---

## 🛠️ Repository Layout

RedactLocal is structured as a unified monorepo containing the desktop shells, WebAssembly engine, test verification lab, and documentation:

```text
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
├── CONTRIBUTING.md          # This file
├── LICENSE                  # MIT License
├── PRIVACY.md               # Privacy policy (Zero telemetry guarantee)
└── README.md                # Project overview & quickstart
```

---

## 🚀 Setting Up Local Development

### 1. Prerequisites
- **Node.js**: v20 or higher (`node -v`)
- **Python**: 3.10+ with `pypdf`, `pdfplumber`, `fitz` (for test lab)
- **Xcode Command Line Tools** (if building the native macOS app): `xcode-select --install`
- **Google Chrome** or **Microsoft Edge** (for headless browser testing and video rendering)

### 2. Clone the Repository
```bash
git clone https://github.com/mohdashraf010897/redactlocal.git
cd redactlocal
```

### 3. Run the Web Studio Locally
No complex build server is required! RedactLocal is built with zero-dependency native Web standards:
```bash
# Option A: Open directly in your browser
open dist/studio.html

# Option B: Run a local static server
npx serve dist
```

### 4. Run the Automated Studio UX & Batch Tests
We maintain an automated Playwright test suite verifying empty states, theme switches, dropdown actions, and multi-file batch execution:
```bash
node scripts/test_studio_ux_verification.mjs
```

### 5. Build the Native macOS App (.app, .dmg, .pkg)
```bash
USE_ADHOC=1 bash scripts/build_macos.sh
python3 scripts/validate_packages.py
```

### 6. Run the Motion Deck Video Generator
```bash
cd redactlocal-deck
npm install
npm run still -- Video --shots --sheet   # Inspect keyframes
npm run render -- Video out/demo.mp4    # Render full 1080p 30fps MP4
```

---

## 💡 Ways to Contribute

We welcome contributions across all areas of the project!

### 1. Expand Statutory Pattern Horizons (Layer 1)
Add regex and checksum validators for international statutory identifiers:
- European Union: IBAN codes, national identification numbers
- United Kingdom: NHS numbers, National Insurance (NINO)
- Canada: Social Insurance Numbers (SIN)
- Australia: Tax File Numbers (TFN), Medicare numbers
- Location in codebase: `redactlocal-app.html` & `dist/studio.html` under `extractSemanticEntities` & statutory pattern matchers.

### 2. Native Desktop Shells
- **Windows**: Enhance NSIS installer and Windows native wrapper.
- **Linux**: Build AppImage and Flatpak distributions.

### 3. Chrome Extension / Quick-Triage Hook
- Build a lightweight Manifest V3 Chrome extension that acts as a quick-triage audit scanner for webmail (Gmail/Outlook) and court dockets.

### 4. Empirical PDF Test Corpus
- Submit synthetic, non-confidential PDF files exhibiting complex edge cases (e.g., obscure CIDFont encodings, Type 3 bitmaps, incremental `/Prev` revisions) to `redaction-test-lab/adversarial_corpus/`.

---

## 🛡️ Submitting Vulnerability or Leak Reports

⚠️ **DO NOT post real confidential documents, real SSNs, banking numbers, or private personal data in a public GitHub issue.**

If you discover a document where redacted text survives or leaks through an unhandled stream encoding:
1. Create a **synthetic dummy PDF** replicating the exact internal structure without sensitive data.
2. For sensitive security reports, email the maintainer directly with subject `[SECURITY] RedactLocal Leak Report`.

---

## 📋 Pull Request Checklist

Before opening a Pull Request:
- [ ] Ensure your changes strictly respect the `connect-src 'none'` air-gapped invariant.
- [ ] Run `node scripts/test_studio_ux_verification.mjs` and confirm all tests pass.
- [ ] If changing the studio UI, keep `redactlocal-app.html` and `dist/studio.html` synchronized.
- [ ] Write clear, descriptive commit messages.

---

## ☕ Support the Project

RedactLocal is 100% free and open-source. If this software saved your firm time or protected your clients, you can support development by:
- Buying us a coffee: [buymeacoffee.com/mohdashraf](https://buymeacoffee.com/mohdashraf)
- Sponsoring on GitHub: [github.com/sponsors/mohdashraf010897](https://github.com/sponsors/mohdashraf010897)
- Giving our repository a ⭐ on [GitHub](https://github.com/mohdashraf010897/redactlocal)!
