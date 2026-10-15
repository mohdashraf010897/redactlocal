// scripts/test_downloads_corpus.mjs - Mass Stress Test Across All 248 Local Downloads PDFs
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// WebKit / Node polyfill for ReadableStream async iteration
if (typeof ReadableStream !== 'undefined' && !ReadableStream.prototype[Symbol.asyncIterator]) {
  ReadableStream.prototype[Symbol.asyncIterator] = async function* () {
    const reader = this.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  };
}

// Polyfill Uint8Array toHex if missing in older Node
if (!Uint8Array.prototype.toHex) {
  Uint8Array.prototype.toHex = function() {
    return Array.from(this).map(b => b.toString(16).padStart(2, '0')).join('');
  };
}

// Polyfill Math.sumPrecise for font calculations
if (!Math.sumPrecise) {
  Math.sumPrecise = function(iterable) {
    let sum = 0;
    for (const n of iterable) sum += Number(n);
    return sum;
  };
}

async function runDownloadsCorpusAudit() {
  console.log("==========================================================");
  console.log(" REDACTLOCAL — STRESS AUDIT ACROSS ALL ~/Downloads/*.pdf");
  console.log("==========================================================");

  const pdfjs = await import('../dist/vendor/pdf.min.mjs');
  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = path.join(ROOT_DIR, 'dist', 'vendor', 'pdf.worker.min.mjs');
  }

  const downloadsDir = path.join(os.homedir(), 'Downloads');
  const allFiles = fs.readdirSync(downloadsDir)
    .filter(f => f.toLowerCase().endsWith('.pdf') && !f.startsWith('.'))
    .map(f => path.join(downloadsDir, f));

  console.log(`Discovered: ${allFiles.length} PDF files in ${downloadsDir}`);
  console.log("Beginning parallel batch analysis & telemetry collection...\n");

  const stats = {
    total: allFiles.length,
    parsedSuccessfully: 0,
    passwordEncrypted: 0,
    scannedPureRaster: 0,
    bornDigitalWithText: 0,
    corruptedOrZeroByte: 0,
    totalOriginalBytes: 0,
    totalPagesScanned: 0,
    totalPiiFieldsDetected: 0,
    piiBreakdown: {
      ssn: 0,
      phone: 0,
      email: 0,
      financial: 0,
      identifiers: 0
    },
    timingsMs: []
  };

  const sampleCorpusResults = [];

  for (let i = 0; i < allFiles.length; i++) {
    const filePath = allFiles[i];
    const fileName = path.basename(filePath);
    const fileStat = fs.statSync(filePath);

    if (fileStat.size === 0) {
      stats.corruptedOrZeroByte++;
      continue;
    }

    stats.totalOriginalBytes += fileStat.size;
    const startT = performance.now();

    try {
      const data = new Uint8Array(fs.readFileSync(filePath));
      const loadingTask = pdfjs.getDocument({ data: data.slice(0) });
      const doc = await loadingTask.promise;

      stats.parsedSuccessfully++;
      const numPages = doc.numPages;
      stats.totalPagesScanned += numPages;

      let docPiiCount = 0;
      let docTextItems = 0;

      // Scan up to 5 pages per document for high-throughput profile
      const pagesToScan = Math.min(numPages, 5);
      for (let p = 1; p <= pagesToScan; p++) {
        const page = await doc.getPage(p);
        const tc = await page.getTextContent();
        docTextItems += tc.items.length;

        const txt = tc.items.map(it => it.str).join(" ");
        const ssn = txt.match(/\b\d{3}-\d{2}-\d{4}\b/g) || [];
        const phone = txt.match(/\b(?:\+?1[-.]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g) || [];
        const email = txt.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
        const ids = txt.match(/(?:D026A|BOSC|[A-Z]{2,4}\d{4,12})/g) || [];
        const amounts = txt.match(/(?:₹|\$)\s*\d+/g) || [];

        stats.piiBreakdown.ssn += ssn.length;
        stats.piiBreakdown.phone += phone.length;
        stats.piiBreakdown.email += email.length;
        stats.piiBreakdown.identifiers += ids.length;
        stats.piiBreakdown.financial += amounts.length;

        docPiiCount += (ssn.length + phone.length + email.length + ids.length + amounts.length);
      }

      stats.totalPiiFieldsDetected += docPiiCount;

      let classification = "Born-Digital Text";
      if (docTextItems === 0) {
        stats.scannedPureRaster++;
        classification = "Scanned Pure Raster";
      } else {
        stats.bornDigitalWithText++;
      }

      const elapsed = performance.now() - startT;
      stats.timingsMs.push(elapsed);

      if (sampleCorpusResults.length < 15 || docPiiCount > 5 || elapsed > 200) {
        sampleCorpusResults.push({
          name: fileName,
          sizeKb: (fileStat.size / 1024).toFixed(1),
          pages: numPages,
          pii: docPiiCount,
          type: classification,
          latencyMs: elapsed.toFixed(1)
        });
      }

      if ((i + 1) % 25 === 0 || (i + 1) === allFiles.length) {
        process.stdout.write(`  [Progress] Audited ${i + 1}/${allFiles.length} files (${((i+1)/allFiles.length*100).toFixed(0)}%)...\r`);
      }

    } catch (err) {
      const elapsed = performance.now() - startT;
      stats.timingsMs.push(elapsed);

      if (err.name === 'PasswordException' || (err.message && err.message.toLowerCase().includes('password'))) {
        stats.passwordEncrypted++;
        sampleCorpusResults.push({
          name: fileName,
          sizeKb: (fileStat.size / 1024).toFixed(1),
          pages: "?",
          pii: 0,
          type: "LOCKED (PASSWORD)",
          latencyMs: elapsed.toFixed(1)
        });
      } else {
        sampleCorpusResults.push({
          name: fileName,
          sizeKb: (fileStat.size / 1024).toFixed(1),
          pages: "?",
          pii: 0,
          type: "ERROR: " + err.message.substring(0, 30),
          latencyMs: elapsed.toFixed(1)
        });
      }
    }
  }

  console.log("\n\n==========================================================");
  console.log(" AUDIT RESULTS & TELEMETRY SUMMARY");
  console.log("==========================================================");
  const totalMb = (stats.totalOriginalBytes / (1024 * 1024)).toFixed(1);
  const avgLatency = (stats.timingsMs.reduce((a, b) => a + b, 0) / stats.timingsMs.length).toFixed(1);
  const p95Latency = stats.timingsMs.sort((a,b) => a - b)[Math.floor(stats.timingsMs.length * 0.95)].toFixed(1);

  console.log(`Total PDF Files Audited:      ${stats.total} (${totalMb} MB)`);
  console.log(`Parsed Successfully:          ${stats.parsedSuccessfully}/${stats.total} (${(stats.parsedSuccessfully/stats.total*100).toFixed(1)}%)`);
  console.log(`  ├─ Born-Digital Text:       ${stats.bornDigitalWithText}`);
  console.log(`  ├─ Scanned Pure Raster:     ${stats.scannedPureRaster}`);
  console.log(`  └─ Password Encrypted:      ${stats.passwordEncrypted}`);
  console.log(`Corrupted / Empty Files:      ${stats.corruptedOrZeroByte}`);
  console.log(`Total Pages Processed:        ${stats.totalPagesScanned}`);
  console.log(`Total PII Fields Trapped:     ${stats.totalPiiFieldsDetected}`);
  console.log(`  ├─ SSNs & Tax IDs:          ${stats.piiBreakdown.ssn}`);
  console.log(`  ├─ Phone Numbers:           ${stats.piiBreakdown.phone}`);
  console.log(`  ├─ Email Addresses:         ${stats.piiBreakdown.email}`);
  console.log(`  ├─ Bank & Account IDs:      ${stats.piiBreakdown.identifiers}`);
  console.log(`  └─ Financial Amounts:       ${stats.piiBreakdown.financial}`);
  console.log(`Throughput / Latency:         Avg ${avgLatency}ms | p95 ${p95Latency}ms per document`);

  console.log("\nRepresentative Corpus Sample Table:");
  console.log("-----------------------------------------------------------------------------------------");
  console.log("FILENAME                                  | PAGES | SIZE     | PII   | TYPE              | TIME");
  console.log("-----------------------------------------------------------------------------------------");
  sampleCorpusResults.slice(0, 15).forEach(s => {
    const fn = (s.name.length > 40 ? s.name.substring(0, 37) + '...' : s.name).padEnd(41);
    const pg = String(s.pages).padEnd(5);
    const sz = (s.sizeKb + ' KB').padEnd(8);
    const pii = (String(s.pii) + ' flds').padEnd(7);
    const tp = s.type.padEnd(17);
    console.log(`${fn} | ${pg} | ${sz} | ${pii} | ${tp} | ${s.latencyMs}ms`);
  });
  console.log("-----------------------------------------------------------------------------------------");
}

runDownloadsCorpusAudit().catch(console.error);
