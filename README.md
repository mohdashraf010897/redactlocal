# RedactLocal 🛡️

> **100% Offline, Privacy-First PDF Surgical Redaction & Leak Audit Utility**  
> Engineered for litigation paralegals, accountants (CPAs), and healthcare compliance.  
> **$49 one-time lifetime license** vs. Adobe Acrobat Pro's **$240/year subscription**.

[![Air-Gapped](https://img.shields.io/badge/Security-Air--Gapped%20(0%20Bytes%20Network)-emerald)](./)
[![WebAssembly](https://img.shields.io/badge/Engine-mupdf.js%20Wasm-blue)](./)
[![License](https://img.shields.io/badge/Licensing-Offline%20Ed25519-purple)](./)
[![Compliance](https://img.shields.io/badge/Compliance-FRCP%205.2%20%7C%20HIPAA-success)](./)

---

## The Problem: The "Black Rectangle Trap"

Most people think that drawing a black rectangle over text in Apple Preview, Microsoft Word, or cheap web converters redacts it. **It does not.** 

Drawing a black box only adds a visual drawing layer on top. The underlying character glyphs, unrendered AcroForm widget values (`/V`), incremental revision histories (`/Prev`), and XML data streams (`/XFA`) remain intact inside the file. Anyone can highlight the black box, press `Cmd+C`, and copy out secret Social Security Numbers, bank account details, and patient medical records.

Major law firms and government agencies (including the Manafort trial team and the US Department of Justice) have repeatedly suffered public sanctions and malpractice suits due to fake visual redactions.

---

## The Solution: True Surgical Redaction

RedactLocal operates completely offline on your device using a high-performance **WebAssembly engine (`mupdf.js`)**:

1. **Content Stream Surgery**: Permanently eradicates underlying character operators (`Tj`, `TJ`) from content streams.
2. **Interactive Form Scrubbing**: Nullifies AcroForm field values (`/V`, `/DV`) and severs dynamic XML form streams (`/XFA`).
3. **Raster Pixel Burnout**: Overwrites the underlying pixel bytes inside image XObjects (`PDF_REDACT_IMAGE_PIXELS`) for scanned documents.
4. **Clean Serialization**: Rewrites the entire file from scratch (`clean=True, garbage=4`) with zero incremental revision history (`/Prev`).
5. **Independent 7-Oracle Verification**: Every output is verified against 7 independent automated oracles (including Mozilla PDF.js & pypdf) before delivery, generating an official **Cryptographic Receipt of Redaction**.

---

## Repository Structure

```
├── dist/                      # Unified production PWA static bundle
│   ├── index.html             # Free Web Leak Checker PWA (Top-of-funnel scanner)
│   ├── studio.html            # RedactLocal Studio (Single doc & Batch queue)
│   ├── sw.js                  # Offline Service Worker (100% air-gapped PWA cache)
│   └── manifest.webmanifest   # Web App Manifest
├── leak-checker/              # Free client-side forensic leak scanner source
├── redactlocal-app.html       # Primary interactive application studio source
├── core/
│   └── engine/
│       ├── redaction_worker.js     # Universal Web Worker 10-step Wasm pipeline
│       ├── license_verifier.js     # Offline Ed25519 digital signature verifier
│       └── checkout_fulfillment.js # Serverless webhook order minting handler
├── src-tauri/                 # Native desktop application shell (Tauri v2)
│   └── tauri.conf.json        # Air-gapped CSP (connect-src 'none')
├── redaction-test-lab/        # Empirical validation lab & adversarial test corpus
│   ├── hardened_verifier.py   # 7-Oracle Python verification suite
│   └── adversarial_corpus/    # 30 multi-jurisdiction synthetic test PDFs
├── scripts/
│   ├── serve.mjs              # Zero-dependency local production preview server
│   ├── deploy.sh              # 1-click multi-target deployment helper
│   └── generate_license.mjs   # Authority Ed25519 license key minting utility
└── .github/workflows/
    └── deploy-pages.yml       # GitHub Actions automated Pages CI/CD
```

---

## Quick Start

### 1. Run the Production Studio & Leak Checker Locally
No external dependencies required:
```bash
node scripts/serve.mjs
```
Open your browser at:
- **Free Leak Checker PWA**: `http://localhost:8080/index.html`
- **RedactLocal Studio**: `http://localhost:8080/studio.html`

### 2. Run the 7-Oracle Adversarial Test Corpus
```bash
python3 redaction-test-lab/adversarial_corpus/run_corpus_tests.py
```

### 3. Deploy to Public Edge CDN
```bash
./scripts/deploy.sh
```

---

## Licensing Architecture (Ed25519 Cryptography)

RedactLocal never contacts a licensing server. Licenses are issued as tamper-evident `.rlkey` digital certificates signed using our master Ed25519 private key. 

The application embeds the public key directly and uses the native **Web Crypto API** (`crypto.subtle.verify`) to authenticate license tiers in <1ms completely offline.

---

## Compliance Standards

- **Federal Rule of Civil Procedure 5.2 (FRCP 5.2)**: Mandatory redaction of Social Security Numbers, Taxpayer IDs, financial accounts, dates of birth, and minor children's names.
- **HIPAA Safe Harbor Privacy Rule**: 18 protected health information (PHI) identifiers.
- **Strict Single-Xref Serialization**: Eradication of incremental save pointers.

---

## Author & Maintainer
Created and maintained by **Mohd Ashraf**.
Project documentation and architecture design records maintained in the RedactLocal knowledge base.
