// tests/ner_pipeline_test.mjs - Verification Suite for On-Device Semantic NER & Hybrid Fusion
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractSemanticEntities, NER_LABELS } from '../core/engine/ner_worker.js';
import { HybridFusionEngine } from '../core/engine/fusion_engine.js';
import { extractStatutoryPiiFromText } from '../core/engine/statutory_patterns.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log("==========================================================");
console.log(" REDACTLOCAL — ON-DEVICE SEMANTIC NER & FUSION TEST SUITE");
console.log("==========================================================");

// Mock Viewport for Coordinate Transforms
const mockViewport = {
  width: 612,
  height: 792,
  convertToViewportPoint: (x, y) => [x * 0.8, y * 0.8]
};

// 1. Test Ground-Truth Unstructured Entities
const gtPath = path.join(__dirname, 'ner_ground_truth.jsonl');
const lines = fs.readFileSync(gtPath, 'utf-8').trim().split('\n');

let totalAssertions = 0;
let passedAssertions = 0;

console.log("\n[1/3] Testing Ground-Truth Semantic Extraction from JSONL...");

for (const line of lines) {
  if (!line.trim()) continue;
  const item = JSON.parse(line);
  console.log(`\nCase [${item.id}]: "${item.text.substring(0, 60)}..."`);

  // Build simulated PDF.js text items
  const words = item.text.split(" ");
  const mockTextContent = {
    items: words.map((w, idx) => ({
      str: w,
      transform: [1, 0, 0, 1, 50 + (idx * 25), 100],
      width: w.length * 7,
      height: 12
    }))
  };

  const entities = extractSemanticEntities(mockTextContent, mockViewport);

  if (item.is_negative_control) {
    totalAssertions++;
    if (entities.length === 0) {
      passedAssertions++;
      console.log(`  ✓ [PASS] Negative control respected: 0 sensitive entities caught`);
    } else {
      console.error(`  ✗ [FAIL] False positive in negative control: caught ${entities.length} items`);
    }
  } else {
    for (const exp of item.expected) {
      totalAssertions++;
      const found = entities.some(e => e.value.includes(exp.entity) || exp.entity.includes(e.value));
      if (found) {
        passedAssertions++;
        console.log(`  ✓ [PASS] Found expected entity: "${exp.entity}" (${exp.tag})`);
      } else {
        console.error(`  ✗ [FAIL] Missed expected entity: "${exp.entity}" (${exp.tag})`);
      }
    }
  }
}

// 2. Test Hybrid Fusion Engine
console.log("\n[2/3] Testing Hybrid Fusion Engine (Statutory + NER + User)...");

const fusion = new HybridFusionEngine({ overlapThreshold: 0.3 });

const statutoryCandidates = [
  {
    id: "s1",
    name: "PAN: ABCDE1234F",
    tag: "PAN_CARD",
    category: "Individual/Entity Tax ID",
    coords: { top: 10, left: 15, width: 20, height: 3 },
    box: "top: 10.00%; left: 15.00%; width: 20.00%; height: 3.00%;"
  }
];

const nerCandidates = [
  // Case A: Overlapping NER with statutory (same coordinates, e.g. recognized as entity)
  {
    id: "n1",
    name: "Entity: ABCDE1234F",
    tag: "PROPRIETARY_ORG",
    coords: { top: 10, left: 15.5, width: 19.5, height: 3 },
    confidence: 0.82
  },
  // Case B: Disjoint NER (doctor name elsewhere on page)
  {
    id: "n2",
    name: "Person: Dr. Robert Smith",
    tag: "CONFIDENTIAL_PERSON",
    coords: { top: 25, left: 20, width: 25, height: 3 },
    confidence: 0.91
  }
];

const userCandidates = [
  {
    id: "u1",
    name: "User Manual Box",
    coords: { top: 50, left: 10, width: 30, height: 5 }
  }
];

const fusedResults = fusion.fusePageDetections({
  statutory: statutoryCandidates,
  ner: nerCandidates,
  user: userCandidates
});

totalAssertions += 4;

// Assertion 1: Total fused items should be 3 (overlapping n1 merged into s1; n2 retained; u1 added)
if (fusedResults.length === 3) {
  passedAssertions++;
  console.log(`  ✓ [PASS] Correctly deduplicated overlapping candidates: 3 final targets`);
} else {
  console.error(`  ✗ [FAIL] Expected 3 fused items, got ${fusedResults.length}`);
}

// Assertion 2: s1 should preserve PAN_CARD tag over generic PROPRIETARY_ORG
const s1Fused = fusedResults.find(f => f.coords.top === 10);
if (s1Fused && s1Fused.tag === "PAN_CARD") {
  passedAssertions++;
  console.log(`  ✓ [PASS] Statutory priority preserved: tag remains PAN_CARD`);
} else {
  console.error(`  ✗ [FAIL] Statutory priority failed: tag is ${s1Fused?.tag}`);
}

// Assertion 3: s1 should have multi-source provenance tracking both rules
if (s1Fused && s1Fused.provenance.includes("statutory_rule") && s1Fused.provenance.includes("local_ner")) {
  passedAssertions++;
  console.log(`  ✓ [PASS] Multi-layer provenance tracked: [${s1Fused.provenance.join(", ")}]`);
} else {
  console.error(`  ✗ [FAIL] Provenance tracking failed`);
}

// Assertion 4: Disjoint NER candidate n2 retained as review candidate
const n2Fused = fusedResults.find(f => f.coords.top === 25);
if (n2Fused && n2Fused.tag === "CONFIDENTIAL_PERSON" && n2Fused.status === "REVIEW_CANDIDATE") {
  passedAssertions++;
  console.log(`  ✓ [PASS] Disjoint NER candidate retained: "${n2Fused.name}" (${n2Fused.status})`);
} else {
  console.error(`  ✗ [FAIL] Disjoint NER candidate failed`);
}

// 3. Test Full Multi-Layer Page Pipeline
console.log("\n[3/3] Testing End-to-End Hybrid Text Extraction...");

const complexPageText = "Invoice issued to Dr. Johnathan Doe (PAN: ABCDE1234F, Aadhaar: 5432 1098 7654) residing at 450 Lexington Avenue, New York, NY for Total Amount ₹ 150,000.";
const statutoryMatches = extractStatutoryPiiFromText(complexPageText);

totalAssertions += 3;

const hasPan = statutoryMatches.some(m => m.tag === "PAN_CARD" && m.value === "ABCDE1234F");
const hasAadhaar = statutoryMatches.some(m => m.tag === "AADHAAR" && m.value === "5432 1098 7654");
const hasAmount = statutoryMatches.some(m => m.tag === "FINANCIAL" && m.value.includes("150,000"));

if (hasPan) { passedAssertions++; console.log(`  ✓ [PASS] Extracted statutory PAN: ABCDE1234F`); }
else { console.error(`  ✗ [FAIL] Failed to extract PAN`); }

if (hasAadhaar) { passedAssertions++; console.log(`  ✓ [PASS] Extracted statutory Aadhaar: 5432 1098 7654`); }
else { console.error(`  ✗ [FAIL] Failed to extract Aadhaar`); }

if (hasAmount) { passedAssertions++; console.log(`  ✓ [PASS] Extracted statutory Amount: ₹ 150,000`); }
else { console.error(`  ✗ [FAIL] Failed to extract Amount`); }

console.log("\n==========================================================");
console.log(` SEMANTIC NER & FUSION TEST RESULTS: ${passedAssertions}/${totalAssertions} PASSED (${((passedAssertions/totalAssertions)*100).toFixed(1)}%)`);
console.log("==========================================================");

if (passedAssertions !== totalAssertions) {
  process.exit(1);
} else {
  console.log("✓ Hybrid Fusion & Semantic NER Architecture verified 100%!\n");
}
