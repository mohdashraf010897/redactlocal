#!/usr/bin/env node
/**
 * scripts/generate_license.mjs — RedactLocal Authority Key & Offline License Minting Utility
 *
 * Mints tamper-evident Ed25519 digital license files (.rlkey) for RedactLocal.
 * The client desktop/web app verifies these licenses 100% locally with ZERO network calls.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const KEYS_DIR = path.resolve('keys');
if (!fs.existsSync(KEYS_DIR)) {
  fs.mkdirSync(KEYS_DIR, { recursive: true });
}

const PRIV_KEY_PATH = path.join(KEYS_DIR, 'authority_private.key');
const PUB_KEY_PATH = path.join(KEYS_DIR, 'authority_public.key');

// Step 1: Ensure master authority keypair exists
let privateKey, publicKey;
if (!fs.existsSync(PRIV_KEY_PATH) || !fs.existsSync(PUB_KEY_PATH)) {
  console.log('[*] Generating new Master Ed25519 Authority Keypair...');
  const keypair = crypto.generateKeyPairSync('ed25519');
  privateKey = keypair.privateKey;
  publicKey = keypair.publicKey;

  fs.writeFileSync(PRIV_KEY_PATH, privateKey.export({ type: 'pkcs8', format: 'pem' }));
  fs.writeFileSync(PUB_KEY_PATH, publicKey.export({ type: 'spki', format: 'pem' }));
  console.log(`[+] Master keys written to ${KEYS_DIR}/`);
} else {
  privateKey = crypto.createPrivateKey(fs.readFileSync(PRIV_KEY_PATH, 'utf8'));
  publicKey = crypto.createPublicKey(fs.readFileSync(PUB_KEY_PATH, 'utf8'));
}

// Export raw 32-byte public key as Base64 for client embedding
const pubDer = publicKey.export({ type: 'spki', format: 'der' });
// In Ed25519 SPKI DER, the raw 32-byte public key occupies the last 32 bytes
const rawPubKeyBytes = pubDer.subarray(pubDer.length - 32);
const rawPubKeyBase64 = rawPubKeyBytes.toString('base64');

console.log(`[+] RedactLocal Embedded Public Key (Base64): ${rawPubKeyBase64}`);

/**
 * Mint a signed license file (.rlkey)
 */
export function mintLicense({ licensee, email, tier, seats = 1, expiresAt = null, orderId = null }) {
  const payload = {
    v: 1,
    app: "RedactLocal",
    order_id: orderId || `RL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    licensee,
    email,
    tier, // "founder_lifetime" | "personal_lifetime" | "team_5" | "team_10" | "site_50"
    seats,
    issued_at: new Date().toISOString(),
    expires_at: expiresAt, // null for lifetime
    features: {
      max_pages_per_doc: 999999,
      batch_processing: true,
      court_receipts: true,
      custom_regex_presets: true,
      air_gap_enforced: true
    }
  };

  // Canonical JSON serialization for deterministic hashing
  const payloadStr = JSON.stringify(payload);
  const signature = crypto.sign(null, Buffer.from(payloadStr, 'utf8'), privateKey);

  const licenseFile = {
    ...payload,
    sig: signature.toString('base64')
  };

  return {
    licenseJson: JSON.stringify(licenseFile, null, 2),
    rawPayload: payloadStr,
    signatureBase64: signature.toString('base64'),
    licenseObj: licenseFile
  };
}

// Generate sample licenses for development and testing
const SAMPLES = [
  {
    name: 'sample_founder_lifetime.rlkey',
    meta: {
      licensee: 'Sarah Jenkins, Esq.',
      email: 'sjenkins@apex-litigation.com',
      tier: 'founder_lifetime',
      seats: 1,
      orderId: 'ORD-FOUNDER-001'
    }
  },
  {
    name: 'sample_firm_team10.rlkey',
    meta: {
      licensee: 'Oakland Forensic Accounting LLC',
      email: 'licenses@oakland-accounting.com',
      tier: 'team_10',
      seats: 10,
      orderId: 'ORD-FIRM-1002'
    }
  }
];

const LICENSES_OUT = path.resolve('core/engine/samples');
if (!fs.existsSync(LICENSES_OUT)) {
  fs.mkdirSync(LICENSES_OUT, { recursive: true });
}

console.log('[*] Minting sample test licenses...');
for (const sample of SAMPLES) {
  const { licenseJson } = mintLicense(sample.meta);
  const outPath = path.join(LICENSES_OUT, sample.name);
  fs.writeFileSync(outPath, licenseJson, 'utf8');
  console.log(`    -> Wrote ${outPath}`);
}

// Export config file for UI
const CLIENT_CONFIG = `// Auto-generated authority config for RedactLocal client
export const REDACTLOCAL_AUTHORITY_PUBKEY_B64 = "${rawPubKeyBase64}";
`;
fs.writeFileSync(path.resolve('core/engine/authority_key.js'), CLIENT_CONFIG, 'utf8');
console.log(`[+] Wrote core/engine/authority_key.js`);
