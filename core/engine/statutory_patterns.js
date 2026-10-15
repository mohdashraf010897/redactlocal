// core/engine/statutory_patterns.js - Canonical Multi-Statutory PII Pattern Registry
// Standardized across Single Studio, Batch Queue, Tests, and Web Workers

export const STATUTORY_PATTERNS = [
  // 1. National Identity & Corporate Tax
  {
    id: "GSTIN",
    tag: "GSTIN",
    category: "Corporate Tax ID",
    regex: /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}\b/g,
    formatLabel: (match) => `GSTIN: ${match}`
  },
  {
    id: "TAN",
    tag: "TAN",
    category: "Tax Deduction Account",
    regex: /\b[A-Z]{4}[0-9]{5}[A-Z]\b/g,
    formatLabel: (match) => `TAN: ${match}`
  },
  {
    id: "PAN_CARD",
    tag: "PAN_CARD",
    category: "Individual/Entity Tax ID",
    regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
    formatLabel: (match) => `PAN: ${match}`
  },
  {
    id: "AADHAAR",
    tag: "AADHAAR",
    category: "National UIDAI Identity",
    regex: /\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    formatLabel: (match) => `Aadhaar: ${match}`
  },
  {
    id: "SSN",
    tag: "SSN",
    category: "US Social Security / Tax ID",
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    formatLabel: (match) => `SSN: ${match}`
  },
  {
    id: "PASSPORT",
    tag: "PASSPORT",
    category: "International Passport",
    regex: /\b[A-Z][0-9]{7}\b/g,
    formatLabel: (match) => `Passport: ${match}`
  },

  // 2. Banking, Financial & Electronic Payments
  {
    id: "IFSC_CODE",
    tag: "IFSC_CODE",
    category: "Wire Transfer Routing",
    regex: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,
    formatLabel: (match) => `IFSC: ${match}`
  },
  {
    id: "CREDIT_CARD",
    tag: "CREDIT_CARD",
    category: "Payment Card Number",
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    formatLabel: (match) => `Card: ${match.replace(/\d(?=\d{4})/g, '*')}`
  },
  {
    id: "UPI_VPA",
    tag: "UPI_VPA",
    category: "Unified Payments Interface",
    regex: /\b[a-zA-Z0-9.\-_]{2,49}@(okhdfcbank|okicici|oksbi|okaxis|ybl|paytm|apl|ibl|axl)\b/gi,
    formatLabel: (match) => `UPI: ${match}`
  },
  {
    id: "BANK_ACCOUNT",
    tag: "BANK_ACCOUNT",
    category: "Bank Account Number",
    regex: /\b\d{11,18}\b/g,
    formatLabel: (match) => `Account: ${match}`
  },
  {
    id: "FINANCIAL",
    tag: "FINANCIAL",
    category: "Currency & Transaction Amount",
    regex: /(?:₹|Rs\.?|INR|\$|€|£)\s*[\d,]+(?:\.\d{2})?/g,
    formatLabel: (match) => `Amount: ${match}`
  },

  // 3. Contact & Telecom
  {
    id: "PHONE",
    tag: "PHONE",
    category: "Telephone Number",
    regex: /(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b|\b(?:\+?1[-.]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    formatLabel: (match) => `Phone: ${match}`
  },
  {
    id: "EMAIL",
    tag: "EMAIL",
    category: "Email Address",
    regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
    formatLabel: (match) => `Email: ${match}`
  },
  {
    id: "PINCODE",
    tag: "PINCODE",
    category: "Postal Code",
    regex: /(?:PIN|Pincode|Pin Code|Postal Code)[\s:]*([1-9][0-9]{5})\b/gi,
    formatLabel: (match) => `PIN: ${match}`
  },

  // 4. Vital Records & Healthcare
  {
    id: "DOB",
    tag: "DOB",
    category: "Date of Birth",
    regex: /(?:DOB|Date of Birth|D\.O\.B|Birth Date)[\s:]*([0-3]?\d[-/\.][0-1]?\d[-/\.](?:19|20)?\d{2})/gi,
    formatLabel: (match) => `DOB: ${match}`
  },
  {
    id: "MEDICAL_POLICY",
    tag: "MEDICAL_POLICY",
    category: "Medical Record / Policy ID",
    regex: /(?:UHID|MRN|Policy No|Claim ID|IPD No|OPD No|Member ID)[\s#:]*([A-Z0-9\-/]{5,20})/gi,
    formatLabel: (match) => `Policy: ${match}`
  },

  // 5. General Confidential Identifiers & Field Labels
  {
    id: "IDENTIFIER",
    tag: "IDENTIFIER",
    category: "Institutional Identifier",
    regex: /(?:D026A|BOSC|[A-Z]{2,4}\d{4,12})/g,
    formatLabel: (match) => `ID: ${match}`
  },
  {
    id: "CONFIDENTIAL",
    tag: "CONFIDENTIAL",
    category: "Confidential Form Field",
    regex: /(?:Name|Father|Mother|Student|Account|Roll|Receipt|Beneficiary|Patient|Policy|Claim|Enrollment)[\s:]+[A-Za-z0-9\s]+/gi,
    formatLabel: (match) => `Field: ${match}`
  }
];

/**
 * Scan raw page text for statutory PII fields.
 * Returns an array of detected field records with provenance.
 */
export function extractStatutoryPiiFromText(text) {
  if (!text || typeof text !== 'string') return [];
  const matches = [];

  for (const pattern of STATUTORY_PATTERNS) {
    // Reset regex index if global
    pattern.regex.lastIndex = 0;
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      matches.push({
        value: match[0].trim(),
        tag: pattern.tag,
        label: pattern.formatLabel(match[0].trim()),
        category: pattern.category,
        index: match.index,
        length: match[0].length,
        provenance: "statutory_rule"
      });
    }
  }

  return matches;
}
