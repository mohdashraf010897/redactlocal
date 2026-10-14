#!/usr/bin/env node
/**
 * scripts/simulate_webhook_purchase.mjs
 *
 * End-to-end automated verification test for RedactLocal Webhook Fulfillment Engine:
 * 1. Simulates Lemon Squeezy purchase webhook (`order_created`) with valid HMAC-SHA256.
 * 2. Simulates Stripe checkout webhook (`checkout.session.completed`) with valid Stripe HMAC.
 * 3. Tests security guards: bad signatures rejected with 401, ignored events handled cleanly.
 * 4. Verifies minted `.rlkey` digital certificates against `core/engine/license_verifier.js` offline!
 * 5. Tests anti-counterfeit tamper detection (modifying payload breaks Ed25519 signature).
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import worker from '../core/engine/cloudflare_worker.js';
import { verifyLicenseOffline } from '../core/engine/license_verifier.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const PRIV_KEY_PATH = path.join(ROOT_DIR, 'keys', 'authority_private.key');

// Configuration
const LEMON_SECRET = 'lemon_webhook_secret_mock_739281';
const STRIPE_SECRET = 'whsec_stripe_mock_secret_849201';

// Read or derive private key
let privateKeyHex;
if (fs.existsSync(PRIV_KEY_PATH)) {
  const pem = fs.readFileSync(PRIV_KEY_PATH, 'utf8');
  const privKey = crypto.createPrivateKey(pem);
  const der = privKey.export({ format: 'der', type: 'pkcs8' });
  const seed = der.subarray(der.length - 32);
  privateKeyHex = seed.toString('hex');
} else {
  // Fallback to canonical test authority seed
  privateKeyHex = 'a95f817aa8f56ec3dbce2e81ee95bd57c9aee360d270ef33ba41154466dd02e5';
}

const mockEnv = {
  LEMONSQUEEZY_WEBHOOK_SECRET: LEMON_SECRET,
  STRIPE_WEBHOOK_SECRET: STRIPE_SECRET,
  ED25519_PRIVATE_KEY: privateKeyHex,
  EMAIL_FROM: 'RedactLocal <licenses@redactlocal.com>'
};

// ANSI color helpers
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

async function runTestSuite() {
  const startTime = Date.now();
  console.log(`\n${BOLD}${CYAN}================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}   RedactLocal Webhook Fulfillment & Ed25519 Minting Test Suite   ${RESET}`);
  console.log(`${BOLD}${CYAN}================================================================${RESET}\n`);

  // -------------------------------------------------------------
  // Test 1: Health check endpoint
  // -------------------------------------------------------------
  console.log(`${BOLD}[Test 1] Health Check Endpoint (GET /health)${RESET}`);
  {
    const req = new Request('https://fulfill.redactlocal.com/health', {
      method: 'GET'
    });
    const res = await worker.fetch(req, mockEnv);
    assert(res.status === 200, `Health check returned HTTP 200 (got ${res.status})`);
    const data = await res.json();
    assert(data.status === 'ok', `Health status is 'ok'`);
    assert(data.service.includes('RedactLocal'), `Service identity confirmed: ${data.service}`);
  }

  // -------------------------------------------------------------
  // Test 2: Lemon Squeezy Order Webhook (order_created)
  // -------------------------------------------------------------
  console.log(`\n${BOLD}[Test 2] Lemon Squeezy Webhook Fulfillment (order_created)${RESET}`);
  let lemonMintedLicense = null;
  {
    const mockOrderPayload = {
      meta: {
        event_name: 'order_created',
        custom_data: {
          licensee: 'Sarah Jenkins, Esq.',
          tier: 'founder_lifetime'
        }
      },
      data: {
        type: 'orders',
        id: '98124501',
        attributes: {
          identifier: 'LS-ORD-98124501',
          order_number: 98124501,
          user_name: 'Sarah Jenkins, Esq.',
          user_email: 'sarah.jenkins@jenkinslaw.com',
          status: 'paid',
          first_order_item: {
            product_name: 'RedactLocal Founder Lifetime Pass',
            variant_name: 'Founder Lifetime ($39)',
            price: 3900
          }
        }
      }
    };

    const rawBody = JSON.stringify(mockOrderPayload);
    const validSignature = crypto
      .createHmac('sha256', LEMON_SECRET)
      .update(rawBody)
      .digest('hex');

    const req = new Request('https://fulfill.redactlocal.com/webhook/lemonsqueezy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': validSignature
      },
      body: rawBody
    });

    const res = await worker.fetch(req, mockEnv);
    assert(res.status === 200, `Lemon Squeezy webhook returned HTTP 200`);

    const result = await res.json();
    assert(result.success === true, `Response reported success: true`);
    assert(result.provider === 'lemonsqueezy', `Provider identified as lemonsqueezy`);
    assert(result.order_id === 'LS-ORD-98124501', `Order ID matched: ${result.order_id}`);
    assert(result.licensee === 'Sarah Jenkins, Esq.', `Licensee matched: ${result.licensee}`);
    assert(result.email === 'sarah.jenkins@jenkinslaw.com', `Email matched: ${result.email}`);
    assert(result.tier === 'founder_lifetime', `Tier matched: ${result.tier}`);
    assert(result.seats === 1, `Seats matched: ${result.seats}`);
    assert(result.filename.endsWith('.rlkey'), `Filename is .rlkey: ${result.filename}`);
    assert(typeof result.license === 'object', `License object returned`);
    assert(typeof result.license.sig === 'string', `Ed25519 cryptographic signature generated`);

    lemonMintedLicense = result.license;
  }

  // -------------------------------------------------------------
  // Test 3: Zero-Network Offline Verification of Lemon Squeezy .rlkey
  // -------------------------------------------------------------
  console.log(`\n${BOLD}[Test 3] Offline Verification of Minted Lemon Squeezy .rlkey${RESET}`);
  {
    const verification = await verifyLicenseOffline(lemonMintedLicense);
    assert(verification.valid === true, `license_verifier.js verified Ed25519 signature offline`);
    assert(verification.tier === 'founder_lifetime', `Verified tier is 'founder_lifetime'`);
    assert(verification.licensee === 'Sarah Jenkins, Esq.', `Verified licensee: ${verification.licensee}`);
    assert(verification.orderId === 'LS-ORD-98124501', `Verified orderId: ${verification.orderId}`);
    assert(verification.seats === 1, `Verified seats: 1`);
    assert(verification.maxPages === 999999, `Verified unlimited pages: ${verification.maxPages}`);
    assert(verification.reason === null, `No verification errors reported`);

    // Verify raw JSON string verification as would be imported via drag & drop
    const rawJsonStr = JSON.stringify(lemonMintedLicense, null, 2);
    const rawVerification = await verifyLicenseOffline(rawJsonStr);
    assert(rawVerification.valid === true, `Direct string import verification passed 100%`);
  }

  // -------------------------------------------------------------
  // Test 4: Stripe Checkout Session Webhook (checkout.session.completed)
  // -------------------------------------------------------------
  console.log(`\n${BOLD}[Test 4] Stripe Webhook Fulfillment (checkout.session.completed)${RESET}`);
  let stripeMintedLicense = null;
  {
    const mockStripePayload = {
      id: 'evt_test_stripe_998877',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_stripe_team10_5544',
          payment_intent: 'pi_test_stripe_team10',
          customer_details: {
            name: 'Oakland Forensic Accounting LLC',
            email: 'licenses@oakland-accounting.com'
          },
          metadata: {
            tier: 'team_10',
            seats: '10',
            licensee: 'Oakland Forensic Accounting LLC'
          },
          amount_total: 19900,
          currency: 'usd',
          payment_status: 'paid'
        }
      }
    };

    const rawBody = JSON.stringify(mockStripePayload);
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${rawBody}`;
    const hmacSig = crypto
      .createHmac('sha256', STRIPE_SECRET)
      .update(signedPayload)
      .digest('hex');
    const stripeHeader = `t=${timestamp},v1=${hmacSig}`;

    const req = new Request('https://fulfill.redactlocal.com/webhook/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': stripeHeader
      },
      body: rawBody
    });

    const res = await worker.fetch(req, mockEnv);
    assert(res.status === 200, `Stripe webhook returned HTTP 200`);

    const result = await res.json();
    assert(result.success === true, `Stripe response reported success: true`);
    assert(result.provider === 'stripe', `Provider identified as stripe`);
    assert(result.order_id === 'cs_test_stripe_team10_5544', `Order ID matched Stripe session`);
    assert(result.licensee === 'Oakland Forensic Accounting LLC', `Firm name preserved`);
    assert(result.tier === 'team_10', `Tier parsed as 'team_10'`);
    assert(result.seats === 10, `Firm seats mapped to 10 seats`);

    stripeMintedLicense = result.license;
  }

  // -------------------------------------------------------------
  // Test 5: Offline Verification of Minted Stripe Team-10 .rlkey
  // -------------------------------------------------------------
  console.log(`\n${BOLD}[Test 5] Offline Verification of Minted Stripe Team-10 .rlkey${RESET}`);
  {
    const verification = await verifyLicenseOffline(stripeMintedLicense);
    assert(verification.valid === true, `Stripe firm license verified offline via Web Crypto`);
    assert(verification.tier === 'team_10', `Verified firm tier: 'team_10'`);
    assert(verification.seats === 10, `Verified 10 seats assigned`);
    assert(verification.licensee === 'Oakland Forensic Accounting LLC', `Verified firm name`);
  }

  // -------------------------------------------------------------
  // Test 6: Security - Invalid HMAC Signature Rejection
  // -------------------------------------------------------------
  console.log(`\n${BOLD}[Test 6] Security: Tampered / Forged HMAC Webhook Signatures${RESET}`);
  {
    // 6a: Lemon Squeezy bad signature
    const badReqLemon = new Request('https://fulfill.redactlocal.com/webhook/lemonsqueezy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': '0000000000000000000000000000000000000000000000000000000000000000'
      },
      body: JSON.stringify({ meta: { event_name: 'order_created' } })
    });
    const resLemon = await worker.fetch(badReqLemon, mockEnv);
    assert(resLemon.status === 401, `Forged Lemon Squeezy HMAC rejected with HTTP 401`);

    // 6b: Stripe bad signature
    const badReqStripe = new Request('https://fulfill.redactlocal.com/webhook/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': `t=${Math.floor(Date.now() / 1000)},v1=badbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbad`
      },
      body: JSON.stringify({ type: 'checkout.session.completed' })
    });
    const resStripe = await worker.fetch(badReqStripe, mockEnv);
    assert(resStripe.status === 401, `Forged Stripe HMAC rejected with HTTP 401`);

    // 6c: Missing signature header
    const noSigReq = new Request('https://fulfill.redactlocal.com/webhook/lemonsqueezy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    const resNoSig = await worker.fetch(noSigReq, mockEnv);
    assert(resNoSig.status === 401, `Missing signature header rejected with HTTP 401`);
  }

  // -------------------------------------------------------------
  // Test 7: Security - Tampered .rlkey Forgery Detection
  // -------------------------------------------------------------
  console.log(`\n${BOLD}[Test 7] Security: Tampered .rlkey Cryptographic Defense${RESET}`);
  {
    // Clone legitimate license and tamper with licensee name
    const tamperedLicense = JSON.parse(JSON.stringify(lemonMintedLicense));
    tamperedLicense.licensee = 'Adversary / Unauthorized Attacker';

    const auditTampered = await verifyLicenseOffline(tamperedLicense);
    assert(auditTampered.valid === false, `Tampered licensee caught: valid is false`);
    assert(
      auditTampered.reason.includes('Cryptographic signature mismatch') ||
      auditTampered.reason.includes('tampered'),
      `Counterfeit rejection notice: "${auditTampered.reason}"`
    );
    assert(auditTampered.maxPages === 3, `Falling back to free tier (3 pages maximum)`);
  }

  // -------------------------------------------------------------
  // Test 8: Non-order Webhook Events (Safe Ignored Status)
  // -------------------------------------------------------------
  console.log(`\n${BOLD}[Test 8] Graceful Handling of Non-order Events (e.g. Subscriptions)${RESET}`);
  {
    const subPayload = {
      meta: { event_name: 'subscription_cancelled' },
      data: { id: 'sub_123' }
    };
    const rawBody = JSON.stringify(subPayload);
    const validSignature = crypto
      .createHmac('sha256', LEMON_SECRET)
      .update(rawBody)
      .digest('hex');

    const req = new Request('https://fulfill.redactlocal.com/webhook/lemonsqueezy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': validSignature
      },
      body: rawBody
    });

    const res = await worker.fetch(req, mockEnv);
    assert(res.status === 200, `Non-order event acknowledged with HTTP 200`);
    const data = await res.json();
    assert(data.status === 'ignored', `Event status marked 'ignored'`);
  }

  const duration = Date.now() - startTime;
  console.log(`\n${BOLD}${GREEN}================================================================${RESET}`);
  console.log(`${BOLD}${GREEN}  ✓ ALL ${passedTests}/${totalTests} TESTS PASSED 100% IN ${duration}ms!${RESET}`);
  console.log(`${BOLD}${GREEN}  Offline Ed25519 Digital License Engine is Production-Ready.${RESET}`);
  console.log(`${BOLD}${GREEN}================================================================${RESET}\n`);
}

runTestSuite().catch(err => {
  console.error(`\n${RED}Fatal Test Runner Exception:${RESET}`, err);
  process.exit(1);
});
