// redactlocal-deck/src/story.ts
// Central narrative data for RedactLocal motion graphics video

export const story = {
  product: "RedactLocal",
  tagline: "100% Offline, Air-Gapped PDF Redaction & Verifier",
  badge: "AIR-GAPPED VERIFIED · ZERO CLOUD TELEMETRY · connect-src 'none'",

  batch: {
    kicker: "01 — MULTI-DOCUMENT BATCH QUEUE",
    title: "Process Entire Exhibit Bundles in Seconds",
    subtitle: "Trial exhibits, subpoena dumps, and tax firm archives redacted simultaneously offline.",
    profile: "Statutory Profile: FRCP 5.2 Court Standard (SSN, Financial, Minor Names)",
    items: [
      { name: "Exhibit_A_JMIs_Fee_Receipt.pdf", pages: "1 pg", pii: "6 fields", status: "✓ 100% CLEAN" },
      { name: "IRS_Form_W9_Filled_Taxpayer.pdf", pages: "1 pg", pii: "4 fields", status: "✓ 100% CLEAN" },
      { name: "Corporate_Merger_NDA_Executed.pdf", pages: "4 pgs", pii: "8 fields", status: "✓ 100% CLEAN" },
      { name: "Memorial_Hospital_Intake_Chart.pdf", pages: "3 pgs", pii: "11 fields", status: "✓ 100% CLEAN" },
      { name: "US_Court_AO88B_Subpoena.pdf", pages: "2 pgs", pii: "5 fields", status: "✓ 100% CLEAN" },
    ],
    exportZip: "📦 Download All (ZIP)",
    exportCsv: "📊 Compliance Audit CSV",
    speed: "⚡ 5 files (11 pages) excised in 142ms · 0 bytes transmitted",
  },

  single: {
    kicker: "02 — VISUAL VIEWPORT & 3-LAYER SURGERY",
    title: "Deep Single-Document Inspection & Review",
    subtitle: "Click 'Inspect 🔍' on any exhibit for live visual inspection and human discretion.",
    docName: "Corporate_Merger_NDA_Executed.pdf",
    layers: [
      { id: "L1", name: "15 Statutory Rules", desc: "SSN, TIN, Routing, Bank AC, Credit Cards" },
      { id: "L2", name: "On-Device Semantic NER", desc: "Attorneys, Corporate Entities, Addresses" },
      { id: "L3", name: "Human Discretion Box", desc: "Click to exclude or draw custom redactions" },
    ],
    oraclesPass: "✓ 7/7 FAIL-CLOSED ORACLES PASSED",
    receiptTitle: "Cryptographic Receipt of Redaction",
    receiptSha: "SHA-256: e3cdc487...ac37460b · Court-Admissible Proof",
  },

  trap: {
    kicker: "THE DANGEROUS REALITY",
    title: "Drawing black boxes doesn't delete secrets.",
    subtitle: "In Acrobat & Preview, text remains inside the raw document streams.",
    docName: "IRS_Form_W9_Case_Filing.pdf",
    leakAlert: "LEAK DETECTED: /Widget /V (450-12-8899)",
    warning: "Anyone can copy-paste the hidden text straight out of the PDF.",
  },

  engine: {
    kicker: "THE 3-LAYER ARCHITECTURE",
    title: "Surgical Bytecode Eradication",
    subtitle: "Runs 100% locally on your machine with zero server uploads.",
    step1: "Layer 1: 15 Statutory Formats (PAN, Aadhaar, GSTIN, TAN, SSN, Cards)",
    step2: "Layer 2: On-Device Semantic NER (Names, Addresses, Diagnoses)",
    step3: "Layer 3: Total User Discretion & Free-Will Toggle (Keep or Redact)",
    speed: "⚡ 50 pages processed in 79ms · 100% Offline Air-Gapped",
  },

  oracles: {
    kicker: "INDEPENDENT VERIFICATION",
    title: "The 7-Oracle Clean Room",
    subtitle: "Audited by Mozilla PDF.js & pypdf. Verified fail-closed.",
    oraclesList: [
      { id: "O1", label: "Dual Independent Parsers", desc: "0 residual text glyphs extracted" },
      { id: "O2", label: "Raw Bytecode & Stream Scan", desc: "ASCII, Hex & Octal streams clean" },
      { id: "O3", label: "Structural AcroForm & XFA", desc: "Form field values eradicated" },
      { id: "O4", label: "Raster Pixel Burnout", desc: "Scanned photo pixels destroyed" },
      { id: "O5", label: "Collateral Damage Guard", desc: "Surrounding legal text preserved" },
      { id: "O6", label: "Metadata & XMP Wipe", desc: "Author, OS & revision tags purged" },
      { id: "O7", label: "Fail-Closed Fuzzer Proof", desc: "100% adversarial traps defeated" },
    ],
    receipt: "Official Cryptographic Receipt of Redaction (SHA-256)",
  },

  end: {
    headline: "Protect your clients. Protect your firm.",
    priceTag: "100% Free & Open Source · MIT Licensed",
    vsAcrobat: "vs Adobe Acrobat Pro ($240/yr cloud subscription)",
    ctaMac: "🍏 macOS (.dmg & .pkg) · 🪟 Windows (.msi & .exe)",
    ctaWeb: "☕ Buy Me a Coffee · ⭐ Star on GitHub",
    url: "github.com/mohdashraf010897/redactlocal",
  },
};

