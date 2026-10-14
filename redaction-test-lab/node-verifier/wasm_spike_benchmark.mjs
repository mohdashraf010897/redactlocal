import * as mupdf from 'mupdf';
import fs from 'fs';
import path from 'path';

console.log("===========================================================================");
console.log("REDACTLOCAL STAGE 1: MUPDF.JS WEBASSEMBLY BENCHMARK & MEMORY SPIKE");
console.log("Evaluating Web Worker / Tauri v2 In-Process Wasm Engine Feasibility");
console.log("===========================================================================");

// 1. Synthetic Stress Test Generator: Build a 50-page document
console.log("\n[1/3] Generating multi-page benchmark document...");
const samplePath = '../samples/type_a_born_digital_contract.pdf';
const singlePageBuf = fs.readFileSync(samplePath);
const baseDoc = mupdf.Document.openDocument(singlePageBuf, "application/pdf");

// Create 50-page stress document in memory
const stressDoc = mupdf.Document.openDocument(singlePageBuf, "application/pdf");
for (let i = 0; i < 49; i++) {
  stressDoc.graftPage(i + 1, baseDoc, 0);
}
const stressBuf = stressDoc.saveToBuffer("compress,clean,garbage=4").asUint8Array();
console.log(`Generated 50-page benchmark PDF: ${(stressBuf.byteLength / 1024).toFixed(1)} KB`);

// 2. Run Wasm Redaction Benchmark
console.log("\n[2/3] Executing Wasm Redaction Pipeline across 50 pages...");
const memBefore = process.memoryUsage();
const tStart = performance.now();

const doc = mupdf.Document.openDocument(stressBuf, "application/pdf");
const numPages = doc.countPages();
const pageLatencies = [];

let totalRedactions = 0;

for (let p = 0; p < numPages; p++) {
  const tPageStart = performance.now();
  const page = doc.loadPage(p);

  // Search targets
  const matches1 = page.search("452-89-1029");
  const matches2 = page.search("9928172645");
  const allMatches = [...matches1, ...matches2];

  for (const quad of allMatches) {
    // Quad is [ul_x, ul_y, ur_x, ur_y, ll_x, ll_y, lr_x, lr_y]
    // Calculate bounding rect
    const minX = Math.min(quad[0], quad[2], quad[4], quad[6]);
    const minY = Math.min(quad[1], quad[3], quad[5], quad[7]);
    const maxX = Math.max(quad[0], quad[2], quad[4], quad[6]);
    const maxY = Math.max(quad[1], quad[3], quad[5], quad[7]);

    const annot = page.createAnnotation("Redact");
    annot.setRect([minX, minY, maxX, maxY]);
    totalRedactions++;
  }

  // Apply redaction to page
  page.applyRedactions(false, 2); // 2 = image pixel burnout
  const pageElapsed = performance.now() - tPageStart;
  pageLatencies.push(pageElapsed);
}

// Full rewrite serialization
const tSaveStart = performance.now();
const redactedBuf = doc.saveToBuffer("compress,clean,garbage=4").asUint8Array();
const saveElapsed = performance.now() - tSaveStart;

// Save output PDF for oracle verification
fs.writeFileSync('../outputs/wasm_redacted_contract_50p.pdf', redactedBuf);

const totalElapsed = performance.now() - tStart;
const memAfter = process.memoryUsage();

// 3. Compute Metrics & Gate Comparison
pageLatencies.sort((a, b) => a - b);
const p50 = pageLatencies[Math.floor(pageLatencies.length * 0.5)];
const p95 = pageLatencies[Math.floor(pageLatencies.length * 0.95)];
const avgPage = pageLatencies.reduce((a, b) => a + b, 0) / pageLatencies.length;
const heapDeltaMB = (memAfter.heapUsed - memBefore.heapUsed) / (1024 * 1024);
const peakHeapMB = memAfter.heapUsed / (1024 * 1024);

console.log("\n[3/3] BENCHMARK RESULTS & GATE EVALUATION:");
console.log("---------------------------------------------------------------------------");
console.log(`Document Size:          ${numPages} pages | ${(stressBuf.byteLength / 1024).toFixed(1)} KB`);
console.log(`Redactions Applied:     ${totalRedactions} bounding boxes`);
console.log(`Total Time:             ${totalElapsed.toFixed(1)} ms`);
console.log(`Average Per-Page Time:  ${avgPage.toFixed(2)} ms / page`);
console.log(`p50 Latency:            ${p50.toFixed(2)} ms / page`);
console.log(`p95 Latency:            ${p95.toFixed(2)} ms / page`);
console.log(`Serialization / Save:   ${saveElapsed.toFixed(1)} ms`);
console.log(`Peak Heap Memory:       ${peakHeapMB.toFixed(2)} MB`);
console.log(`Heap Growth:            ${heapDeltaMB > 0 ? '+' : ''}${heapDeltaMB.toFixed(2)} MB`);
console.log("---------------------------------------------------------------------------");

// Council Gate Checks:
// Gate: peak heap < 1.5 GB (1500 MB) and p95 < 600 ms/page
const heapPass = peakHeapMB < 1500;
const p95Pass = p95 < 600;
const gateVerdict = heapPass && p95Pass ? "PASSED (WASM ENGINE CLEARED FOR V1)" : "FAILED (FALLBACK TO NATIVE SIDECAR)";

console.log(`GATE CHECK 1: Peak Heap < 1.5 GB:     ${heapPass ? 'PASS' : 'FAIL'} (${peakHeapMB.toFixed(1)} MB / 1500 MB limit)`);
console.log(`GATE CHECK 2: p95 Latency < 600ms/pg: ${p95Pass ? 'PASS' : 'FAIL'} (${p95.toFixed(1)} ms / 600 ms limit)`);
console.log(`\nFINAL STAGE 1 GATE VERDICT: ${gateVerdict}`);
console.log("===========================================================================");

// Write report to JSON
fs.writeFileSync('../wasm_spike_results.json', JSON.stringify({
  timestamp: Date.now(),
  numPages,
  totalRedactions,
  totalElapsedMs: totalElapsed,
  avgPageMs: avgPage,
  p50Ms: p50,
  p95Ms: p95,
  saveMs: saveElapsed,
  peakHeapMB,
  heapDeltaMB,
  heapPass,
  p95Pass,
  gateVerdict
}, null, 2));
