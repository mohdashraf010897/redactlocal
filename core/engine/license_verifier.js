/**
 * core/engine/license_verifier.js — Zero-Network Offline Ed25519 License Verifier
 *
 * Runs 100% locally in browser, Web Worker, or Tauri webview via Web Crypto API.
 * Never performs network lookups or external pingbacks.
 */

import { REDACTLOCAL_AUTHORITY_PUBKEY_B64 } from './authority_key.js';

// Base64 helper compatible with Browser + Node
function base64ToUint8(b64) {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

/**
 * Verifies an Ed25519 signed license file (.rlkey)
 * @param {string|object} licenseData - Parsed JSON object or raw JSON string
 * @returns {Promise<{ valid: boolean, tier: string, licensee?: string, maxPages: number, reason?: string }>}
 */
export async function verifyLicenseOffline(licenseData) {
  try {
    const parsed = typeof licenseData === 'string' ? JSON.parse(licenseData) : licenseData;

    if (!parsed || !parsed.sig || parsed.app !== 'RedactLocal') {
      return {
        valid: false,
        tier: 'free_tier',
        maxPages: 3,
        reason: 'Invalid or missing RedactLocal license signature.'
      };
    }

    const { sig, ...payload } = parsed;
    const signatureBytes = base64ToUint8(sig);
    const payloadStr = JSON.stringify(payload);
    const payloadBytes = new TextEncoder().encode(payloadStr);

    // Import RedactLocal Authority public key via Web Crypto
    const pubKeyBytes = base64ToUint8(REDACTLOCAL_AUTHORITY_PUBKEY_B64);
    const cryptoSubtle = globalThis.crypto?.subtle;

    if (!cryptoSubtle) {
      throw new Error('Web Crypto API (crypto.subtle) unavailable in this runtime.');
    }

    const cryptoKey = await cryptoSubtle.importKey(
      'raw',
      pubKeyBytes,
      { name: 'Ed25519' },
      false,
      ['verify']
    );

    // Cryptographic signature check
    const isValid = await cryptoSubtle.verify(
      'Ed25519',
      cryptoKey,
      signatureBytes,
      payloadBytes
    );

    if (!isValid) {
      return {
        valid: false,
        tier: 'free_tier',
        maxPages: 3,
        reason: 'Cryptographic signature mismatch. License is counterfeit or tampered.'
      };
    }

    // Check expiration if present
    if (payload.expires_at) {
      const expDate = new Date(payload.expires_at);
      if (expDate < new Date()) {
        return {
          valid: false,
          tier: 'free_tier',
          maxPages: 3,
          reason: `License expired on ${expDate.toLocaleDateString()}.`
        };
      }
    }

    return {
      valid: true,
      tier: payload.tier,
      licensee: payload.licensee,
      email: payload.email,
      orderId: payload.order_id,
      seats: payload.seats || 1,
      maxPages: payload.features?.max_pages_per_doc ?? 999999,
      features: payload.features,
      reason: null
    };

  } catch (err) {
    return {
      valid: false,
      tier: 'free_tier',
      maxPages: 3,
      reason: `Verification error: ${err.message}`
    };
  }
}
