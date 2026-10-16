import { chromium } from '/Users/mashraf/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const studioPath = path.resolve(__dirname, '../redactlocal-app.html');
const studioUrl = `file://${studioPath}`;

async function runStudioTests() {
  console.log('Starting Studio UX & Batch verification tests...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 950 } });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (err) => {
    errors.push(err.message);
    console.error('Browser Page Error:', err.message);
  });

  try {
    await page.goto(studioUrl, { waitUntil: 'load' });
    console.log('✓ Page loaded cleanly');

    // 1. Verify Initial Empty State
    const selectorVal = await page.$eval('#doc-selector', el => el.value);
    if (selectorVal !== '') throw new Error(`Expected initial doc-selector to be empty, got: ${selectorVal}`);
    const emptyStateVisible = await page.$eval('#viewport-empty-state', el => window.getComputedStyle(el).display !== 'none');
    if (!emptyStateVisible) throw new Error('Expected viewport-empty-state to be visible');
    console.log('✓ Initial state is empty and clean');

    // 2. Test Theme Toggle
    const initialTheme = await page.$eval('html', el => el.getAttribute('data-theme') || 'light');
    await page.click('#theme-toggle-btn');
    const newTheme = await page.$eval('html', el => el.getAttribute('data-theme'));
    if (newTheme === initialTheme) throw new Error(`Theme toggle failed: theme stayed ${initialTheme}`);
    console.log(`✓ Theme toggle works: switched from ${initialTheme} to ${newTheme}`);
    // Switch back
    await page.click('#theme-toggle-btn');

    // 3. Test Desktop App Dropdown
    const ddHidden = await page.$eval('#download-dropdown', el => el.style.display === 'none');
    if (!ddHidden) throw new Error('Expected download-dropdown to be hidden initially');
    await page.click('#download-app-btn');
    const ddVisible = await page.$eval('#download-dropdown', el => el.style.display === 'block');
    if (!ddVisible) throw new Error('Expected download-dropdown to be visible after click');
    await page.click('body', { position: { x: 50, y: 50 } });
    const ddClosed = await page.$eval('#download-dropdown', el => el.style.display === 'none');
    if (!ddClosed) throw new Error('Expected download-dropdown to close on outside click');
    console.log('✓ Download Native App dropdown opens and closes cleanly');

    // 4. Test Single Document Load via "Explore Sample NDA ->"
    await page.click('#viewport-empty-state button:has-text("Explore Sample NDA")');
    await page.waitForTimeout(100);
    const activeDoc = await page.$eval('#doc-selector', el => el.value);
    if (activeDoc !== 'contract') throw new Error(`Expected active doc to be contract, got: ${activeDoc}`);
    const detectedCount = await page.$eval('#detected-count', el => el.innerText);
    if (detectedCount !== '7') throw new Error(`Expected 7 detected target fields, got: ${detectedCount}`);
    console.log(`✓ Loaded sample document: ${activeDoc} with ${detectedCount} PII fields`);

    // 5. Test Single Document Redaction
    await page.click('#btn-run-pipeline');
    await page.waitForTimeout(600); // Allow oracle animation
    const verdict = await page.$eval('#metric-verdict', el => el.innerText);
    if (!verdict.includes('100% CLEAN')) throw new Error(`Expected verdict 100% CLEAN, got: ${verdict}`);
    const dlBtnVisible = await page.$eval('#btn-download-pdf', el => el.style.display === 'flex');
    if (!dlBtnVisible) throw new Error('Expected download PDF button to be visible after redaction');
    console.log(`✓ Single document redaction succeeded: ${verdict}`);

    // 6. Test Batch Processing Queue
    await page.click('#tab-batch-queue');
    const batchTabActive = await page.$eval('#tab-batch-queue', el => el.classList.contains('active'));
    if (!batchTabActive) throw new Error('Expected batch tab to be active');

    // Load sample batch
    await page.click('a:has-text("load 5 sample legal/tax filings")');
    await page.waitForTimeout(300);
    const batchCount = await page.$eval('#batch-badge-count', el => el.innerText);
    if (batchCount !== '5') throw new Error(`Expected batch count 5, got: ${batchCount}`);
    console.log(`✓ Loaded sample batch with ${batchCount} documents`);

    // Run batch redaction
    await page.click('#btn-run-batch');
    await page.waitForTimeout(1200); // Allow batch pipeline
    const completedItems = await page.$$eval('#batch-table-body tr', rows => 
      rows.filter(r => r.innerText.includes('100% CLEAN')).length
    );
    if (completedItems !== 5) throw new Error(`Expected 5 completed items, got: ${completedItems}`);
    const zipBtnVisible = await page.$eval('#btn-batch-zip', el => el.style.display !== 'none');
    const csvBtnVisible = await page.$eval('#btn-batch-csv', el => el.style.display !== 'none');
    if (!zipBtnVisible || !csvBtnVisible) throw new Error('Expected ZIP and CSV buttons to be visible');
    console.log(`✓ Batch redaction complete: 5/5 documents excised, ZIP and CSV export ready`);

    // 7. Test "Inspect 🔍" action from batch item
    await page.click('#batch-table-body tr:nth-child(1) button:has-text("Inspect")');
    await page.waitForTimeout(200);
    const singleTabRestored = await page.$eval('#tab-single-doc', el => el.classList.contains('active'));
    if (!singleTabRestored) throw new Error('Expected Single Document Studio to be active after Inspect');
    console.log('✓ Inspect 🔍 successfully transitioned document into Single Document Studio');

    // 8. Test Clear Batch
    await page.click('#tab-batch-queue');
    await page.click('button:has-text("Clear")');
    const clearedCount = await page.$eval('#batch-badge-count', el => el.innerText);
    if (clearedCount !== '0') throw new Error(`Expected batch count 0 after clear, got: ${clearedCount}`);
    console.log('✓ Batch queue cleared cleanly');

    // 9. Test Open Source Badge and Buy Me a Coffee button & About Modal
    await page.click('#tab-single-doc');
    const coffeeHref = await page.$eval('#btn-coffee', el => el.href);
    if (!coffeeHref.includes('buymeacoffee.com')) throw new Error(`Expected Buy Me a Coffee button href, got: ${coffeeHref}`);
    const openSourceBadgeText = await page.$eval('#opensource-badge', el => el.innerText);
    if (!openSourceBadgeText.includes('OPEN SOURCE')) throw new Error(`Expected Open Source badge, got: ${openSourceBadgeText}`);

    // Click badge to open About & Support modal
    await page.click('#opensource-badge');
    const aboutModalVisible = await page.$eval('#about-modal', el => el.classList.contains('active'));
    if (!aboutModalVisible) throw new Error('Expected about-modal to be active after clicking opensource-badge');
    await page.click('#about-modal button:has-text("Close")');
    const aboutModalClosed = await page.$eval('#about-modal', el => !el.classList.contains('active'));
    if (!aboutModalClosed) throw new Error('Expected about-modal to close on Close button');
    console.log('✓ Open Source MIT badge and Buy Me a Coffee modal verified');

    if (errors.length > 0) {
      throw new Error(`Encountered ${errors.length} unhandled browser error(s):\n${errors.join('\n')}`);
    }

    console.log('\n==================================================');
    console.log('🎉 ALL 8 STUDIO UX & BATCH PROCESSING TESTS PASSED!');
    console.log('==================================================');
  } finally {
    await browser.close();
  }
}

runStudioTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
