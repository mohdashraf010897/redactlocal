// Story text for the Chrome Extension Demo & Use Cases film
import type { IconName } from "./kit/icons";

export const story = {
  product: "RedactLocal",
  tagline: "The 100% Offline Browser Redactor.",
  footer: "PRODUCT DEMO · CHROME EXTENSION",

  install: {
    kicker: "Step 01 · Chrome Web Store",
    title: "Install in One Click",
    url: "chromewebstore.google.com/detail/redactlocal",
    extTitle: "RedactLocal — 100% Offline PDF Redactor",
    meta: "Featured · Productivity · ★★★★★ 4.9 (1.2k reviews)",
    btn: "Add to Chrome",
    btnDone: "✓ Added to Chrome",
    caption: "One-click install from the Chrome Web Store. No account, no subscription required.",
  },

  legal: {
    kicker: "Use Case 01 · Legal & HR",
    title: "Court Exhibits & Employee Files",
    url: "file:///Downloads/Court_Exhibit_04.pdf",
    filename: "Court_Exhibit_04.pdf",
    docType: "UNITED STATES DISTRICT COURT",
    ref: "Case 26-CV-04192 · Confidential Exhibit",
    targetField: "SSN: 942-01-4491",
    emailField: "Contact: jdoe@private-practice.law",
    detected: "2 PII TOKENS DETECTED",
    purged: "[GLYPHS PERMANENTLY STRIPPED]",
    caption: "Auto-detects SSNs, names, and contact details with zero text left selectable.",
  },

  finance: {
    kicker: "Use Case 02 · Finance & Banking",
    title: "Invoices & Bank Statements",
    url: "file:///invoices/Wire_Invoice_9082.pdf",
    filename: "Wire_Invoice_9082.pdf",
    docType: "COMMERCIAL WIRE INVOICE",
    ref: "Invoice #INV-2026-9082 · Net 30",
    targetField: "Routing: 021000021 · Acct: 8492019482",
    taxField: "Tax ID: 12-3456789 (US-EIN)",
    detected: "WIRE DETAILS DETECTED",
    purged: "[BANK DATA SANITIZED]",
    caption: "Sanitizes routing codes, account numbers, and wire details before client dispatch.",
  },

  medical: {
    kicker: "Use Case 03 · Healthcare & HIPAA",
    title: "Patient Intake & Medical Records",
    url: "file:///records/Patient_Intake_Form.pdf",
    filename: "Patient_Intake_Form.pdf",
    docType: "METROPOLITAN HEALTHCARE SYSTEM",
    ref: "Patient Intake Form · Confidential Record",
    targetField: "MRN: 90218-A · DOB: 04/12/1982",
    diagField: "Diagnosis: Acute Cardiac Episode",
    detected: "HIPAA PII DETECTED",
    purged: "[MEDICAL RECORD SECURED]",
    caption: "Full HIPAA compliance. All processing runs in local browser WebAssembly.",
  },

  closing: {
    kicker: "Open Source Utility",
    title: "100% Private. Zero Cloud.",
    line: "Built in 3 weeks. Replaces Adobe's $240 tax.",
    cta: "100% Free · MIT Licensed",
    caption: "Zero server compute, zero database upkeep, and zero third-party cloud leaks.",
  },

  // Retain legacy pitch fields so pitch scenes stay fully compatible
  trap: {
    kicker: "The Market Trap",
    title: "The $240 Redaction Tax",
    adobe: {
      title: "Adobe Acrobat Pro",
      price: "$239.88 / yr",
      note: "Redaction locked behind bloated bundle",
    },
    cloud: {
      title: "Free Web Uploaders",
      warning: "Uploads confidential files to cloud servers",
      risk: "Violates HIPAA, GDPR & client NDAs",
    },
    doc: {
      name: "Court_Filing_Ex7.pdf",
      label: "CONFIDENTIAL LEGAL DRAFT",
      badge: "SENSITIVE PII",
    },
    caption: "Lawyers, HR, and clinics pay $240/yr just to black out text on confidential files.",
  },

  leak: {
    kicker: "The Critical Flaw",
    title: "Black boxes don't redact.",
    warning: "ALERT: Text still selectable in stream",
    caption: "Drawing black rectangles in Preview or basic PDF viewers leaves text selectable.",
  },

  purge: {
    kicker: "The Technical Wedge",
    title: "Strip the bytes, not the pixels.",
    badge: "100% Client-Side · Zero Server Calls",
    caption: "pdf-lib permanently strips glyph objects from the raw content stream.",
  },

  economics: {
    kicker: "Open Source Utility",
    title: "Built in 3 weeks. $0 server costs.",
    metrics: [
      { num: "$0", label: "Free & Open Source", sub: "Replaces $240/yr Adobe tax", icon: "bolt" as IconName },
      { num: "$0", label: "Monthly Server Cost", sub: "100% client-side WebAssembly", icon: "shield" as IconName },
      { num: "3 Wks", label: "MVP Build Time", sub: "1 solo dev with modern tools", icon: "tool" as IconName },
    ],
    caption: "100% client-side execution with zero database, zero server maintenance, and zero cloud APIs.",
  },

  end: {
    line: "The cleanest open-source privacy utility.",
    cta: "100% Free · Replaces Adobe's $240 Tax",
  },
};

export type Story = typeof story;
