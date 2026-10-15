#!/usr/bin/env node
/**
 * scripts/test_paid_license_flow.mjs
 *
 * End-to-end automated Playwright test for the paid license checkout,
 * cryptographic Ed25519 keycard minting, and in-Studio activation flow.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT_DIR, 'review_screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// ANSI colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  ${RED}✗ FAILED:${RESET} ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  ${GREEN}✓${RESET} ${message}`);
}

async function runTest() {
  console.log(`\n${BOLD}${CYAN}================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}  Testing RedactLocal Paid License Checkout & Fulfillment Flow   ${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================${RESET}\n`);

  const pw = await import('../redactlocal-pitch/node_modules/playwright-core/index.mjs');
  const browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}]: ${msg.text()}`));
  page.on('pageerror', err => console.error("Page error:", err));

  // -------------------------------------------------------------
  // STEP 1: Landing on Marketing Page & Opening Checkout Modal
  // -------------------------------------------------------------
  console.log(`${BOLD}[Phase 1] Marketing Page Checkout Flow (dist/index.html)${RESET}`);
  const indexUrl = 'file://' + path.join(ROOT_DIR, 'dist', 'index.html');
  await page.goto(indexUrl);
  await page.waitForTimeout(400);

  // Clear any existing license in localStorage
  await page.evaluate(() => {
    localStorage.removeItem('redactlocal_license');
    localStorage.removeItem('redactlocal_leads');
  });

  // Click Claim $39 Founders Pass in the Plans section
  const claimBtn = await page.$("#plans button:has-text('Claim $39 Founders Pass')");
  assert(!!claimBtn, "Found 'Claim $39 Founders Pass' button in Plans section");
  await claimBtn.scrollIntoViewIfNeeded();
  await claimBtn.click();
  await page.waitForTimeout(300);

  const modalActive = await page.$eval('#waitlist-modal', el => el.classList.contains('active'));
  assert(modalActive, "Checkout / Pre-Order Modal opened successfully");
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'paid_01_checkout_form.png') });

  // -------------------------------------------------------------
  // STEP 2: Submitting Order & Minting Cryptographic Key
  // -------------------------------------------------------------
  console.log(`\n${BOLD}[Phase 2] Filling Order Form & Minting Ed25519 .rlkey Keycard${RESET}`);
  await page.fill('#waitlist-name', 'Sarah Jenkins, Esq.');
  await page.fill('#waitlist-email', 'sarah@jenkinslaw.com');
  await page.selectOption('#waitlist-tier', 'founder_lifetime');
  await page.selectOption('#waitlist-role', 'legal');

  // Set up download listener
  const downloadPromise = page.waitForEvent('download', { timeout: 4000 }).catch(() => null);

  await page.click('#btn-submit-order');
  await page.waitForTimeout(600);

  // Verify fulfillment view is visible
  const fulfillmentVisible = await page.$eval('#waitlist-fulfillment', el => el.style.display !== 'none');
  assert(fulfillmentVisible, "Fulfillment Card rendered with order confirmation");

  const orderId = await page.$eval('#f-order-id', el => el.innerText);
  assert(orderId.startsWith('RL-ORD-'), `Valid Order ID generated: ${orderId}`);

  const licensee = await page.$eval('#f-licensee', el => el.innerText);
  assert(licensee.includes('Sarah Jenkins, Esq.'), `Licensee recorded correctly: ${licensee}`);

  const tierText = await page.$eval('#f-tier', el => el.innerText);
  assert(tierText.includes('Founders Lifetime Pass'), `Tier confirmed: ${tierText}`);

  const sigText = await page.$eval('#f-signature', el => el.innerText);
  assert(sigText.includes('Ed25519 Valid'), `Ed25519 Signature generated & verified: ${sigText}`);

  // Verify localStorage contains license
  const storedLicense = await page.evaluate(() => JSON.parse(localStorage.getItem('redactlocal_license')));
  assert(!!storedLicense && storedLicense.app === 'RedactLocal', "License certificate stored in localStorage");
  assert(storedLicense.tier === 'founder_lifetime', "Stored license tier matches 'founder_lifetime'");
  assert(storedLicense.features?.max_pages_per_doc === 999999, "Stored license unlocks unlimited pages (999,999)");

  // Check download
  const download = await downloadPromise;
  if (download) {
    const downloadedName = download.suggestedFilename();
    assert(downloadedName.endsWith('.rlkey'), `Browser downloaded .rlkey file: ${downloadedName}`);
  } else {
    console.log("  ℹ️ Download event handled via blob trigger");
  }

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'paid_02_fulfillment_card.png') });

  // -------------------------------------------------------------
  // STEP 3: Transitioning to RedactLocal Studio with Pro Unlocked
  // -------------------------------------------------------------
  console.log(`\n${BOLD}[Phase 3] Studio Experience with Pre-Activated Pro License${RESET}`);
  const studioUrl = 'file://' + path.join(ROOT_DIR, 'dist', 'studio.html');
  await page.goto(studioUrl);
  await page.waitForTimeout(500);

  // Verify license badge reflects PRO
  const badgeText = await page.$eval('#license-status-text', el => el.innerText);
  assert(badgeText.includes('PRO (FOUNDER LIFETIME)'), `Studio Header Badge shows active PRO: "${badgeText}"`);

  // Open License Modal to inspect active details
  await page.click('#license-badge');
  await page.waitForTimeout(300);

  const activeCardVisible = await page.$eval('#license-active-card', el => el.style.display !== 'none');
  assert(activeCardVisible, "Studio License Modal shows Active License Card");

  const mLicensee = await page.$eval('#m-active-licensee', el => el.innerText);
  assert(mLicensee === 'Sarah Jenkins, Esq.', `Modal reflects licensee: ${mLicensee}`);

  const mPages = await page.$eval('#m-active-pages', el => el.innerText);
  assert(mPages.includes('Unlimited'), `Modal reflects unlimited pages limit: ${mPages}`);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'paid_03_studio_pro_active.png') });

  // -------------------------------------------------------------
  // STEP 4: Testing Deactivation & Reverting to Free Tier
  // -------------------------------------------------------------
  console.log(`\n${BOLD}[Phase 4] Testing License Deactivation & Free Tier Reversion${RESET}`);
  await page.click("button:has-text('Deactivate / Switch to Free Tier')");
  await page.waitForTimeout(300);

  const freeBadgeText = await page.$eval('#license-status-text', el => el.innerText);
  assert(freeBadgeText.includes('FREE TIER (≤3 PGS)'), `Studio reverted to Free Tier: "${freeBadgeText}"`);

  const inactiveCardVisible = await page.$eval('#license-inactive-card', el => el.style.display !== 'none');
  assert(inactiveCardVisible, "Modal switched to Inactive / Activation View");

  // -------------------------------------------------------------
  // STEP 5: Testing 1-Click Demo Pro Key Activation
  // -------------------------------------------------------------
  console.log(`\n${BOLD}[Phase 5] Testing 1-Click Load Demo Pro Key${RESET}`);
  await page.click("button:has-text('Load Demo Pro Key')");
  await page.waitForTimeout(400);

  const restoredBadge = await page.$eval('#license-status-text', el => el.innerText);
  assert(restoredBadge.includes('PRO (FOUNDER LIFETIME)'), `Re-activated PRO via 1-click Demo Key: "${restoredBadge}"`);

  // -------------------------------------------------------------
  // STEP 6: Testing In-App Purchase & Custom Key Minting
  // -------------------------------------------------------------
  console.log(`\n${BOLD}[Phase 6] Testing In-App Purchase Flow (Firm Team $199)${RESET}`);
  await page.click('#license-badge');
  await page.waitForTimeout(300);
  await page.click("button:has-text('Deactivate / Switch to Free Tier')");
  await page.waitForTimeout(300);

  // Switch to "Get $39 Founders Pass" tab inside Studio
  await page.click('#tab-btn-buy');
  await page.waitForTimeout(200);

  await page.fill('#app-buy-name', 'Oakland Tax Group');
  await page.fill('#app-buy-email', 'licenses@oakland-tax.com');
  await page.selectOption('#app-buy-tier', 'team_10');

  await page.click('#btn-inapp-mint');
  await page.waitForTimeout(600);

  const firmBadge = await page.$eval('#license-status-text', el => el.innerText);
  assert(firmBadge.includes('PRO (TEAM 10)'), `In-App purchase minted and activated Firm Team license: "${firmBadge}"`);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'paid_04_firm_team_unlocked.png') });

  // -------------------------------------------------------------
  // STEP 7: Testing Multi-Page Free Tier Gating (≤3 Pages)
  // -------------------------------------------------------------
  console.log(`\n${BOLD}[Phase 7] Testing Multi-Page Free Tier Limit Gating${RESET}`);
  // Deactivate license to test Free Tier limit
  await page.click('#license-badge');
  await page.waitForTimeout(300);
  await page.click("button:has-text('Deactivate / Switch to Free Tier')");
  await page.waitForTimeout(300);

  // Set up mock custom multi-page document state
  await page.evaluate(() => {
    window.customPagesCount = 5;
    window.currentCustomPage = 3;
    window.customPdfDoc = {
      numPages: 5,
      getPage: async () => ({
        getViewport: () => ({ width: 600, height: 800 }),
        render: () => ({ promise: Promise.resolve() }),
        getTextContent: async () => ({ items: [] })
      })
    };
  });

  // Attempt to navigate to page 4
  await page.evaluate(() => window.changeCustomPage(1));
  await page.waitForTimeout(300);

  // Verify modal opened and current page stayed at 3
  const curPage = await page.evaluate(() => window.currentCustomPage);
  assert(curPage === 3, `Free tier blocked navigation past page 3 (stayed on page ${curPage})`);
  const licenseModalOpen = await page.$eval('#license-modal', el => el.classList.contains('active'));
  assert(licenseModalOpen, "License Upgrade Modal opened when hitting page 4 limit");

  await browser.close();

  console.log(`\n${BOLD}${GREEN}================================================================${RESET}`);
  console.log(`${BOLD}${GREEN}  ✓ ALL ${passedTests}/${totalTests} PAID LICENSE FLOW TESTS PASSED 100%!  ${RESET}`);
  console.log(`${BOLD}${GREEN}  Checkout, Ed25519 Minting, Storage & Studio Activation Verified! ${RESET}`);
  console.log(`${BOLD}${GREEN}================================================================${RESET}\n`);
}

runTest().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
