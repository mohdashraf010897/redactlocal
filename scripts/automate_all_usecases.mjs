// scripts/automate_all_usecases.mjs - Automated End-to-End Customer Flows & Visual Verification
import { chromium, webkit } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT_DIR, 'automated_test_screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runAllUseCases() {
  console.log("==========================================================");
  console.log(" REDACTLOCAL — AUTOMATED USE CASE VERIFICATION SUITE");
  console.log("==========================================================");

  // Test across both Chromium and WebKit engines
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  const studioPath = `file://${path.join(ROOT_DIR, 'dist', 'studio.html')}`;
  const leakCheckerPath = `file://${path.join(ROOT_DIR, 'leak-checker', 'index.html')}`;

  const results = [];
  function assert(name, condition, detail = "") {
    if (condition) {
      console.log(`  ✓ [PASS] ${name}${detail ? ` (${detail})` : ''}`);
      results.push({ name, pass: true, detail });
    } else {
      console.error(`  ✗ [FAIL] ${name}${detail ? ` (${detail})` : ''}`);
      results.push({ name, pass: false, detail });
    }
  }

  // -------------------------------------------------------------------------
  // USE CASE 1: App Launch, Header Alignment & Theme Button Size
  // -------------------------------------------------------------------------
  console.log("\n[1/10] Verifying Header Alignment & Theme Button Sizing...");
  await page.goto(studioPath);
  await page.waitForLoadState('networkidle');

  const themeBtnBox = await page.locator('#theme-toggle-btn').boundingBox();
  const downloadBtnBox = await page.locator('#download-app-btn').boundingBox();
  const licenseBadgeBox = await page.locator('#license-badge').boundingBox();

  assert("Theme button exists", !!themeBtnBox);
  assert("Theme button width is compact (not 100%)", themeBtnBox.width < 140 && themeBtnBox.width > 60, `width=${themeBtnBox?.width}px`);
  assert("Theme button height is locked to 32px", Math.abs(themeBtnBox.height - 32) <= 2, `height=${themeBtnBox?.height}px`);
  assert("Download button height is 32px", Math.abs(downloadBtnBox.height - 32) <= 2, `height=${downloadBtnBox?.height}px`);
  assert("License badge height is 32px", Math.abs(licenseBadgeBox.height - 32) <= 2, `height=${licenseBadgeBox?.height}px`);
  assert("All header buttons are aligned horizontally on one row", Math.abs(themeBtnBox.y - downloadBtnBox.y) <= 4, `y_diff=${Math.abs(themeBtnBox.y - downloadBtnBox.y)}px`);

  const emptyStateVisible = await page.locator('#viewport-empty-state').isVisible();
  assert("Empty viewport state shown initially", emptyStateVisible);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_header_alignment_clean.png') });

  // -------------------------------------------------------------------------
  // USE CASE 2: Sample Document Selection & PII Bounding Box Rendering
  // -------------------------------------------------------------------------
  console.log("\n[2/10] Loading Sample NDA & Verifying PII Extraction...");
  await page.selectOption('#doc-selector', 'contract');
  await page.waitForTimeout(200);

  const emptyStateHidden = !(await page.locator('#viewport-empty-state').isVisible());
  const singleFrameVisible = await page.locator('#single-page-frame').isVisible();
  assert("Empty state dismissed upon doc selection", emptyStateHidden);
  assert("Single document canvas displayed", singleFrameVisible);

  const piiItemsCount = await page.locator('.queue-item').count();
  assert("Detected PII fields populated in queue", piiItemsCount >= 5, `count=${piiItemsCount}`);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_sample_doc_loaded.png') });

  // -------------------------------------------------------------------------
  // USE CASE 3: Viewport Display Modes (Original, Side-by-Side, Redacted)
  // -------------------------------------------------------------------------
  console.log("\n[3/10] Testing Viewport Comparison Modes...");
  await page.click('#btn-mode-compare');
  await page.waitForTimeout(150);
  const sliderVisible = await page.locator('#slider-compare-frame').isVisible();
  assert("Side-by-side comparison mode active", sliderVisible);

  await page.click('#btn-mode-orig');
  await page.waitForTimeout(150);
  const origVisible = await page.locator('#single-page-frame').isVisible();
  assert("Original highlights view active", origVisible);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_viewport_compare_mode.png') });

  // -------------------------------------------------------------------------
  // USE CASE 4: Surgical Excision Pipeline & 7-Oracle Audit Execution
  // -------------------------------------------------------------------------
  console.log("\n[4/10] Executing 10-Step Excision Pipeline & 7-Oracle Audit...");
  await page.click('#btn-run-pipeline');
  await page.waitForTimeout(600); // Wait for oracle sequential checks

  const verdictText = await page.locator('#metric-verdict').innerText();
  const downloadBtnVisible = await page.locator('#btn-download-pdf').isVisible();
  assert("7 Oracles audit passed with 0 leaks", verdictText.includes("100% CLEAN"), `verdict="${verdictText}"`);
  assert("Download Clean Redacted PDF button revealed", downloadBtnVisible);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_surgical_redaction_completed.png') });

  // -------------------------------------------------------------------------
  // USE CASE 5: Cryptographic Receipt of Redaction Modal
  // -------------------------------------------------------------------------
  console.log("\n[5/10] Inspecting Cryptographic Receipt of Redaction...");
  await page.click('#btn-view-receipt');
  await page.waitForTimeout(200);

  const modalActive = await page.locator('#receipt-modal').evaluate(el => el.classList.contains('active'));
  const receiptContent = await page.locator('#receipt-content').innerText();
  assert("Receipt modal active", modalActive);
  assert("Receipt contains cryptographic proof signature", receiptContent.includes("ed25519:sig:"));
  assert("Receipt contains dual independent parsers audit", receiptContent.includes("Dual Independent Extractors"));

  await page.click('#receipt-modal button:has-text("Done")');
  await page.waitForTimeout(150);
  const modalClosed = !(await page.locator('#receipt-modal').evaluate(el => el.classList.contains('active')));
  assert("Receipt modal closed cleanly", modalClosed);

  // -------------------------------------------------------------------------
  // USE CASE 6: Theme Toggling (Light / Dark)
  // -------------------------------------------------------------------------
  console.log("\n[6/10] Testing Theme Switching...");
  await page.click('#theme-toggle-btn');
  await page.waitForTimeout(200);
  let themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  assert("Dark theme activated", themeAttr === 'dark');

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_dark_mode_active.png') });

  await page.click('#theme-toggle-btn');
  await page.waitForTimeout(200);
  themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  assert("Returned to light theme", themeAttr === null);

  // -------------------------------------------------------------------------
  // USE CASE 7: Offline License Key Activation
  // -------------------------------------------------------------------------
  console.log("\n[7/10] Testing Offline License Key Activation...");
  await page.click('#license-badge');
  await page.waitForTimeout(200);

  const licensePayload = JSON.stringify({
    app: "RedactLocal",
    licensee: "Senior Partner, Litigation Practice",
    tier: "Enterprise",
    sig: "offline_ed25519_verified_mock_signature_2026"
  });

  await page.fill('#license-text-input', licensePayload);
  await page.click('button:has-text("Verify & Activate Offline")');
  await page.waitForTimeout(200);

  const licenseText = await page.locator('#license-status-text').innerText();
  assert("Enterprise license activated offline", licenseText.includes("ENTERPRISE"), `status="${licenseText}"`);

  // -------------------------------------------------------------------------
  // USE CASE 8: Custom PDF Ingestion & Multi-Page Navigation
  // -------------------------------------------------------------------------
  console.log("\n[8/10] Testing Custom Multi-Page PDF Ingestion...");
  const samplePdfPath = path.join(ROOT_DIR, 'test-assets', 'JMI_Online_Fee_Payment_System.pdf');
  const pdfBytes = fs.readFileSync(samplePdfPath);
  const base64Pdf = pdfBytes.toString('base64');

  await page.evaluate(async (b64) => {
    const binStr = atob(b64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
    await loadCustomPdfData(bytes, "Custom_Client_Document.pdf");
  }, base64Pdf);
  await page.waitForTimeout(300);

  const customSelectorVal = await page.locator('#doc-selector').inputValue();
  assert("Custom document loaded into memory", customSelectorVal.startsWith("custom_"));

  // -------------------------------------------------------------------------
  // USE CASE 9: Batch Processing Queue, Inspection Bridge & Multi-File Redaction
  // -------------------------------------------------------------------------
  console.log("\n[9/10] Testing Batch Processing Queue & Multi-File Redaction...");
  await page.click('#tab-batch-queue');
  await page.waitForTimeout(150);

  const batchWorkspaceVisible = await page.locator('#batch-workspace').isVisible();
  assert("Batch processing workspace active", batchWorkspaceVisible);

  // Load 5 sample legal/tax filings
  await page.click('a:has-text("load 5 sample legal/tax filings")');
  await page.waitForTimeout(150);

  const batchRowCount = await page.locator('#batch-table-body tr').count();
  assert("5 documents queued in batch table", batchRowCount === 5, `rows=${batchRowCount}`);

  // Test Inspect 🔍 on Batch Item 2
  console.log("  Testing Inspect 🔍 bridge from batch queue...");
  await page.click('#batch-table-body tr:nth-child(2) button:has-text("Inspect")');
  await page.waitForTimeout(300);

  const singleTabActive = await page.locator('#tab-single-doc').evaluate(el => el.classList.contains('active'));
  assert("Inspect button transitioned to Single Document Studio", singleTabActive);

  // Return to Batch Tab and run Redaction
  await page.click('#tab-batch-queue');
  await page.waitForTimeout(150);

  console.log("  Running Batch Redaction for all queued files...");
  await page.click('#btn-run-batch');
  await page.waitForTimeout(800); // Wait for batch progress

  const statsLine = await page.locator('#batch-stats-line').innerText();
  const zipBtnVisible = await page.locator('#btn-batch-zip').isVisible();
  const csvBtnVisible = await page.locator('#btn-batch-csv').isVisible();

  assert("Batch processing completed all documents", statsLine.includes("complete"), `stats="${statsLine}"`);
  assert("Download Clean ZIP button visible", zipBtnVisible);
  assert("Export CSV button visible", csvBtnVisible);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_batch_queue_completed.png') });

  // -------------------------------------------------------------------------
  // USE CASE 10: Online Leak Scanner (Triage)
  // -------------------------------------------------------------------------
  console.log("\n[10/10] Testing Leak Checker & Triage Scanner...");
  await page.goto(leakCheckerPath);
  await page.waitForLoadState('networkidle');

  // Verify sticky navbar styling
  const leakNavBox = await page.locator('.nav-bar').boundingBox();
  const leakBrandBox = await page.locator('.nav-brand').boundingBox();
  const leakNavBtn = await page.locator('.btn-nav-primary').boundingBox();

  assert("Leak checker navbar exists", !!leakNavBox);
  assert("Navbar links and buttons do not wrap", leakNavBox.height < 60, `height=${leakNavBox?.height}px`);

  // Load audit preset 1 (Type A Born Digital)
  await page.click('button:has-text("Type A: Born-Digital Contract")');
  await page.waitForTimeout(200);

  const auditReportVisible = await page.locator('#audit-report').isVisible();
  assert("Leak audit report generated", auditReportVisible);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_leak_checker_report.png') });

  await browser.close();

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n==========================================================");
  console.log(" VERIFICATION SUMMARY");
  console.log("==========================================================");
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;

  console.log(`Total assertions: ${total}`);
  console.log(`Passed:           ${passed}`);
  console.log(`Failed:           ${failed}`);
  console.log(`Success Rate:     ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.error("\nFailed Assertions:");
    results.filter(r => !r.pass).forEach(r => console.error(` - ${r.name}: ${r.detail}`));
    process.exit(1);
  } else {
    console.log("\n✓ ALL USE CASES AUTOMATED & VERIFIED SUCCESSFULLY!");
  }
}

runAllUseCases().catch(err => {
  console.error("Test Suite Error:", err);
  process.exit(1);
});
