// tests/pii_horizon_test.mjs - Standardized Test Suite for RedactLocal's PII Catching Horizon
import assert from 'assert';

console.log("==========================================================");
console.log(" REDACTLOCAL — STANDARDIZED PII CATCHING HORIZON TEST SUITE");
console.log("==========================================================");

// Standardized Catching Horizon Pattern Registry
export const CATCHING_HORIZON_PATTERNS = {
  // 1. National Identity & Tax Identifiers
  PAN_CARD: {
    tag: "PAN_CARD",
    regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/,
    testValid: ["ABCDE1234F", "BNZPA4371K", "AAACR1234M"],
    testInvalid: ["ABCD1234F", "ABCDE12345", "12345ABCDE"]
  },
  AADHAAR: {
    tag: "AADHAAR",
    regex: /\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b/,
    testValid: ["5432 1098 7654", "5432-1098-7654", "543210987654"],
    testInvalid: ["0123 4567 8901", "1234 5678", "5432 1098 76544"]
  },
  GSTIN: {
    tag: "GSTIN",
    regex: /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}\b/,
    testValid: ["07AAAAA0000A1Z5", "27ABCDE1234F1Z5", "06AAACH1234M1Z2"],
    testInvalid: ["07AAAAA0000A15", "AAAAAA0000A1Z5", "07AAAAA0000A1A5"]
  },
  TAN: {
    tag: "TAN",
    regex: /\b[A-Z]{4}[0-9]{5}[A-Z]\b/,
    testValid: ["DELA12345B", "MUMB98765C", "KOLK54321D"],
    testInvalid: ["DEL12345B", "DELAA12345B", "DELA123456"]
  },
  SSN: {
    tag: "SSN",
    regex: /\b\d{3}-\d{2}-\d{4}\b/,
    testValid: ["452-89-1029", "123-45-6789", "987-65-4321"],
    testInvalid: ["123-456-789", "123456789", "12-345-6789"]
  },
  PASSPORT: {
    tag: "PASSPORT",
    regex: /\b[A-Z][0-9]{7}\b/,
    testValid: ["Z1234567", "A9876543", "M5432109"],
    testInvalid: ["12345678", "AB123456", "A123456"]
  },

  // 2. Financial & Banking
  IFSC: {
    tag: "IFSC",
    regex: /\b[A-Z]{4}0[A-Z0-9]{6}\b/,
    testValid: ["HDFC0001234", "SBIN0005678", "ICIC0000456"],
    testInvalid: ["HDFC1001234", "HDF0001234", "HDFC00012345"]
  },
  BANK_ACCOUNT: {
    tag: "BANK_ACCOUNT",
    regex: /\b\d{11,18}\b/,
    testValid: ["50100234567890", "1234567890123456", "98765432101"],
    testInvalid: ["123456789", "1234567890", "1234567890123456789"]
  },
  CREDIT_CARD: {
    tag: "CREDIT_CARD",
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/,
    testValid: ["4111111111111111", "5500000000000004", "378282246310005"],
    testInvalid: ["1234567890123456", "411111", "550000000000000000"]
  },
  UPI_VPA: {
    tag: "UPI_VPA",
    regex: /\b[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,}\b/,
    testValid: ["user@okhdfcbank", "business.pay@okicici", "john-doe99@paytm", "shop@ybl"],
    testInvalid: ["user@", "@okhdfcbank", "a@b"]
  },
  CURRENCY_AMOUNT: {
    tag: "CURRENCY_AMOUNT",
    regex: /(?:₹|Rs\.?|INR|\$|€|£)\s*[\d,]+(?:\.\d{2})?/,
    testValid: ["₹ 4,750,000.00", "Rs. 85,000", "INR 12,500.50", "$150,000", "€9,400", "£3,250"],
    testInvalid: ["4750000", "cents 50", "units 20"]
  },

  // 3. Contact & Location
  PHONE_INTL: {
    tag: "PHONE_INTL",
    regex: /(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b|\b(?:\+?1[-.]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    testValid: ["+91 98765 43210", "+91-9876543210", "9876543210", "8765432109", "(212) 555-0199", "1-800-555-0199"],
    testInvalid: ["12345", "0123456789", "555-019"]
  },
  EMAIL: {
    tag: "EMAIL",
    regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,
    testValid: ["mashraf@adobe.com", "counsel_johnson@apex-litigation.com", "billing+tax@firm.co.uk"],
    testInvalid: ["notanemail", "@missinguser.com", "user@.com"]
  },
  POSTAL_PINCODE: {
    tag: "POSTAL_PINCODE",
    regex: /(?:PIN|Pincode|Pin Code|Postal Code)[\s:]*([1-9][0-9]{5})\b/i,
    testValid: ["PIN: 110025", "Pincode: 201301", "Postal Code 560001"],
    testInvalid: ["PIN 012345", "PIN 12345"]
  },

  // 4. Healthcare & Vital Records
  DATE_OF_BIRTH: {
    tag: "DATE_OF_BIRTH",
    regex: /(?:DOB|Date of Birth|D\.O\.B|Birth Date)[\s:]*([0-3]?\d[-/\.][0-1]?\d[-/\.](?:19|20)?\d{2})/i,
    testValid: ["DOB: 15/08/1997", "Date of Birth: 01-08-1990", "D.O.B: 24.12.1985"],
    testInvalid: ["DOB: yesterday", "Date of Birth: soon"]
  },
  MEDICAL_POLICY: {
    tag: "MEDICAL_POLICY",
    regex: /(?:UHID|MRN|Policy No|Claim ID|IPD No|OPD No|Member ID)[\s#:]*([A-Z0-9\-/]{5,20})/i,
    testValid: ["UHID: MAX-2026-9812", "Policy No: POL-882716-A", "MRN: 99882103", "Claim ID: CLM-102938"],
    testInvalid: ["UHID: 12", "Policy No: NA"]
  }
};

let totalTests = 0;
let passedTests = 0;

for (const [key, pat] of Object.entries(CATCHING_HORIZON_PATTERNS)) {
  console.log(`\nValidating Category: ${key} (${pat.tag})`);
  
  // Test True Positives
  for (const sample of pat.testValid) {
    totalTests++;
    const match = sample.match(pat.regex);
    if (match) {
      passedTests++;
      console.log(`  ✓ [TP PASS] "${sample}" matched`);
    } else {
      console.error(`  ✗ [TP FAIL] "${sample}" did NOT match regex ${pat.regex}`);
    }
  }

  // Test True Negatives
  for (const invalid of pat.testInvalid) {
    totalTests++;
    const match = invalid.match(pat.regex);
    if (!match) {
      passedTests++;
      console.log(`  ✓ [TN PASS] "${invalid}" correctly rejected`);
    } else {
      console.error(`  ✗ [TN FAIL] "${invalid}" falsely matched regex ${pat.regex}`);
    }
  }
}

console.log("\n==========================================================");
console.log(` CATCHING HORIZON TEST RESULTS: ${passedTests}/${totalTests} PASSED (${((passedTests/totalTests)*100).toFixed(1)}%)`);
console.log("==========================================================");

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  console.log("✓ All 15 statutory & confidential PII categories standardized successfully!\n");
}
