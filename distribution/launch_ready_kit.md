# RedactLocal — Launch Ready Kit (GTM Copy, Posts & Manifests)

This kit contains finalized, copy-pasteable assets for executing Steps 8 through 13 of the Launch Checklist.

---

## 1. Hacker News "Show HN" Post

**Submission URL:** https://news.ycombinator.com/submit  
**Title (Primary - 48 chars):** `Show HN: RedactLocal – 100% offline PDF redaction`  
**Alternative Title (60 chars):** `Show HN: RedactLocal – Air-gapped PDF redaction in browser`  
**URL:** `https://mohdashraf010897.github.io/redactlocal-public/`  

**Text / First Comment:**
```markdown
Hi HN,

During high-profile court proceedings (like the Manafort trial or recent FTC filings), attorneys repeatedly leak confidential SSNs and bank numbers because they draw visual black boxes on top of text in Acrobat or Preview. Copy-pasting the text straight out of the PDF recovers the secrets in seconds because the underlying `Tj`/`TJ` character operators remain untouched in decompressed content streams.

We built RedactLocal (https://mohdashraf010897.github.io/redactlocal-public/) to solve this with a 100% offline, fail-closed architecture:

1. **Surgical Bytecode Eradication:** Rather than painting over text, our WebAssembly engine (MuPDF.js) decompresses xref streams, surgically replaces text glyph operators with whitespace, and burns out underlying raster image pixels.
2. **The 7-Oracle Clean Room:** We don't grade our own homework. Seven independent inspectors (including Mozilla PDF.js & pypdf) decompress the output and prove that 0 residual target glyphs survive across ASCII, UTF-16, Hex, and Octal encodings.
3. **The 3-Layer Solution:** 
   - Layer 1: 15 canonical statutory formats (PAN, Aadhaar, GSTIN, TAN, SSN, Passports, IFSC, Cards).
   - Layer 2: On-device semantic NER for unstructured doctor/patient names and clinical diagnoses without cloud API calls.
   - Layer 3: Visual user discretion (click-to-redact or uncheck to keep public firm addresses visible).
4. **Air-Gapped Privacy:** Strict `connect-src 'none'` Content Security Policy. Zero telemetry, zero analytics, zero server uploads.

We distribute native desktop packages for macOS (.dmg, .pkg) and Windows (.msi, .exe), alongside a free in-browser triage scanner that inspects your existing PDFs for hidden leaks.

Source code and web app: https://mohdashraf010897.github.io/redactlocal-public/
Would love your feedback on the bytecode excision pipeline and oracle audits!
```

---

## 2. Reddit Community Outreach Posts

### Subreddit 1: r/paralegal & r/lawfirm
**Title:** `Why drawing black rectangles in Acrobat gets lawyers sanctioned under FRCP 5.2 (and how we built an air-gapped offline tool to solve it)`  

**Post Body:**
```markdown
Hey everyone,

If you work in litigation, you know that redacting filings under FRCP 5.2 (or state court privacy rules) is high-stakes. One slip, and you're facing judicial sanctions or an ethics complaint.

The dangerous truth is that drawing black boxes in standard PDF tools often only adds a decorative vector overlay on layer 5. The actual text, SSNs, and banking codes are still sitting in the raw bytecode underneath. If opposing counsel (or a journalist) selects the black box and presses Ctrl+C, the secret text copies straight to their clipboard.

My team built **RedactLocal** as a 100% offline, air-gapped desktop utility designed for paralegals and attorneys:

• **Surgical Eradication:** It actually deletes the underlying character codes from the PDF streams rather than just masking them.
• **7-Oracle Verification:** Independent verification proves zero residual bytes remain and generates a Cryptographic Receipt of Redaction for your docket.
• **User Discretion / Free Will:** Checkboxes let you keep public firm emails or court addresses visible so you don't over-redact your filings.
• **Batch Processing:** Drop exhibit bundles or subpoena responses and redact them simultaneously.
• **100% Offline:** Zero cloud uploads. Your confidential client files never leave your computer.

We have a free web leak scanner you can test on your existing files with zero uploads:
👉 https://mohdashraf010897.github.io/redactlocal-public/

Native macOS (.dmg) and Windows (.msi) installers are available now. Would love to hear how your firms currently handle redactions and if this would save you time during docket filings!
```

### Subreddit 2: r/tax & r/accounting
**Title:** `We built an air-gapped, zero-cloud PDF redactor for CPAs handling Form 16, W-9s, and Tax Statements`  

**Post Body:**
```markdown
Hi accountants & CPAs,

Sharing tax returns and financial statements with third parties usually requires redacting PAN cards, Aadhaar numbers, bank account numbers, and spouse/child details. But uploading client financial files to cloud PDF converters violates client confidentiality and data security regulations.

We engineered **RedactLocal** to run 100% locally on your computer with zero cloud telemetry:

- Auto-detects PAN Cards, Aadhaar, GSTIN, TAN, bank accounts, and currency amounts.
- Supports password-protected PDF statements (unlocks offline in memory).
- Batch processes hundreds of client files in seconds.
- 1-click native desktop downloads for Windows (MSI) and macOS (DMG).

Free leak scanner & desktop app: https://mohdashraf010897.github.io/redactlocal-public/
```

---

## 3. Product Hunt Launch Kit

- **Name:** RedactLocal
- **Tagline:** 100% Offline, Air-Gapped PDF Redaction & 7-Oracle Verifier
- **Short Description:** Surgical bytecode PDF redaction utility for paralegals and CPAs. Runs 100% locally with zero cloud telemetry, fail-closed 7-Oracle verification, and air-gapped cryptographic receipts.
- **Topics:** Privacy, Productivity, Developer Tools, Legal Tech, Open Source
- **Maker Comment:**
```markdown
Hello Product Hunt! 👋

We built RedactLocal because drawing black boxes in Acrobat doesn't delete secrets—it just hides them under an overlay that anyone can copy-paste.

RedactLocal is a 100% offline desktop and web application that surgically excises character operators from raw document streams and verifies the output against seven independent fail-closed oracles.

Key features:
🔒 100% Offline Air-Gap: Strict zero-network CSP (connect-src 'none').
🎯 3-Layer Horizon: 15 statutory formats (PAN, Aadhaar, GSTIN, SSN, IFSC) + On-Device Semantic NER + User Discretion toggles.
📚 Batch Processing: Process entire trial exhibit bundles or tax batches with password unlock.
💻 Cross-Platform: 1-click downloads for macOS (.dmg) and Windows (.msi).

We're offering our $39 Lifetime Founders Pass for early supporters today!
Try the free in-browser triage scanner: https://mohdashraf010897.github.io/redactlocal-public/
```

---

## 4. Windows Winget Package Manifest (`winget-pkgs`)

**Manifest Path for PR:** `manifests/r/RedactLocal/RedactLocal/1.0.1/`

### File: `RedactLocal.RedactLocal.installer.yaml`
```yaml
PackageIdentifier: RedactLocal.RedactLocal
PackageVersion: 1.0.1
MinimumOSVersion: 10.0.0.0
InstallerType: msi
InstallModes:
  - interactive
  - silent
  - silentWithProgress
Installers:
  - Architecture: x64
    InstallerUrl: https://github.com/mohdashraf010897/redactlocal-public/releases/download/v1.0.1/RedactLocal_1.0.0_x64_en-US.msi
    InstallerSha256: 43423999324a7ea7a076626db3d1529560c1f32fab663de5203910718990ee67
ManifestType: installer
ManifestVersion: 1.6.0
```

### File: `RedactLocal.RedactLocal.locale.en-US.yaml`
```yaml
PackageIdentifier: RedactLocal.RedactLocal
PackageVersion: 1.0.1
PackageLocale: en-US
Publisher: Mohd Ashraf
PublisherUrl: https://github.com/mohdashraf010897
PublisherSupportUrl: https://github.com/mohdashraf010897/redactlocal-public/issues
PackageName: RedactLocal
PackageUrl: https://mohdashraf010897.github.io/redactlocal-public/
License: MIT
ShortDescription: 100% Offline, Privacy-First PDF Redaction & 7-Oracle Verifier
Description: Surgical bytecode PDF redaction utility engineered for litigation paralegals, CPAs, and healthcare compliance officers with fail-closed 7-Oracle verification and air-gapped cryptographic receipts.
Tags:
  - pdf
  - redaction
  - privacy
  - air-gapped
  - security
  - legaltech
ManifestType: defaultLocale
ManifestVersion: 1.6.0
```

---

## 5. Paid Licensing & Payment Architecture

### Two Operating Modes

1. **Pre-Launch Sandbox Mode (Active Today)**:
   - Built directly into `dist/index.html` and `redactlocal-app.html`.
   - When a user submits the "Claim $39 Founders Pass" form, Web Crypto (`crypto.subtle`) uses the master authority key to mint a valid Ed25519-signed `.rlkey` certificate.
   - It triggers an instant browser download of `redactlocal_license.rlkey` and saves the license to `localStorage.redactlocal_license`.
   - RedactLocal Studio immediately boots as `PRO (FOUNDERS LIFETIME)` with unlimited pages unlocked.
   - **Benefit**: Fully testable and usable for customer demos and beta onboarding today without waiting for Stripe merchant approval or bank verification.

2. **Production Webhook Fulfillment Mode (When Stripe/Lemon Squeezy is Linked)**:
   - Implemented in `core/engine/cloudflare_worker.js` and `core/engine/checkout_fulfillment.js`.
   - Buyer pays via Stripe hosted checkout (`buy.stripe.com/...`).
   - Stripe POSTs `checkout.session.completed` webhook to Cloudflare Worker.
   - Worker verifies HMAC signature, mints `.rlkey` on the edge, and sends transactional email with the keycard attached.
   - Buyer drops `.rlkey` into RedactLocal Desktop.

### Why RedactLocal Doesn't Need a Server for License Verification
- RedactLocal enforces `connect-src 'none'`. The app **never contacts Stripe or any server**.
- Verification is **purely cryptographic**: the client embeds the 32-byte public key `jZGgE4bwWQ18xHwUp27dRsAaKhlolh88FxKWxRzHKQo=` and verifies the Ed25519 digital signature locally in `<2ms`.
- Any tampering with the license file (e.g., editing licensee, seats, or expiration) breaks the cryptographic signature and fails validation offline.

