// core/engine/checkout_fulfillment.js - Merchant-of-Record Webhook & Ed25519 Keycard Minting
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRIVATE_KEY_PATH = path.resolve(__dirname, '../../keys/authority_private.key');
const PUBLIC_KEY_PATH = path.resolve(__dirname, '../../keys/authority_public.key');

/**
 * Mint a tamper-evident Ed25519 digital license for a paying customer.
 * Can be run as a serverless webhook handler (Lemon Squeezy / Paddle).
 */
export function fulfillOrder(orderData) {
  const {
    orderId,
    customerEmail,
    customerName,
    tier = 'founder', // 'founder' ($39), 'pro' ($49), 'firm' ($199)
    seats = tier === 'firm' ? 5 : 1
  } = orderData;

  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    throw new Error(`Master authority private key not found at: ${PRIVATE_KEY_PATH}`);
  }

  const privKeyPem = fs.readFileSync(PRIVATE_KEY_PATH, 'utf-8');
  const privKey = crypto.createPrivateKey(privKeyPem);

  const licensePayload = {
    v: 1,
    app: "RedactLocal",
    order_id: orderId || `RL-ORD-${Date.now()}`,
    licensee: customerName || "Licensed User",
    email: customerEmail || "customer@example.com",
    tier: tier,
    seats: seats,
    issued_at: new Date().toISOString(),
    expires_at: null, // Perpetual lifetime
    features: {
      max_pages_per_doc: 999999,
      batch_processing: true,
      court_receipts: true,
      custom_regex_presets: true,
      air_gap_enforced: true
    }
  };

  const payloadStr = JSON.stringify(licensePayload);
  const signature = crypto.sign(null, Buffer.from(payloadStr, 'utf8'), privKey);

  const licenseCertificate = {
    ...licensePayload,
    sig: signature.toString('base64')
  };

  return {
    licenseCertificate,
    rawKeyFileContent: JSON.stringify(licenseCertificate, null, 2),
    filename: `redactlocal_${customerName ? customerName.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'license'}.rlkey`
  };
}

// Standalone CLI test runner
if (process.argv[1] && process.argv[1].endsWith('checkout_fulfillment.js')) {
  console.log("Simulating Lemon Squeezy Order Webhook Fulfillment...");
  const order = {
    orderId: "LS-98124501",
    customerEmail: "sarah.jenkins@jenkinslaw.com",
    customerName: "Sarah Jenkins, Esq.",
    tier: "founder"
  };
  const result = fulfillOrder(order);
  console.log("✓ Successfully minted offline certificate:");
  console.log(result.rawKeyFileContent);
}
