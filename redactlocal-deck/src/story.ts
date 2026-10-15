// redactlocal-deck/src/story.ts
// Central narrative data for RedactLocal motion graphics video

export const story = {
  product: "RedactLocal",
  tagline: "100% Offline, Privacy-First PDF Redaction",
  badge: "AIR-GAPPED VERIFIED · ZERO CLOUD TELEMETRY",

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
    priceTag: "$39 Founders Pass · Lifetime Offline Access",
    vsAcrobat: "vs Adobe Acrobat Pro ($240/yr cloud subscription)",
    ctaMac: "🍏 macOS (.dmg & .pkg) · 🪟 Windows (.msi & .exe)",
    ctaWeb: "🌐 Free Online Triage Scanner (Zero Uploads)",
    url: "mohdashraf010897.github.io/redactlocal-public",
  },
};
