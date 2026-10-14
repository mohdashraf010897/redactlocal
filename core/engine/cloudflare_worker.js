/**
 * core/engine/cloudflare_worker.js — Serverless Webhook Fulfillment Engine
 *
 * Turn-key Cloudflare Worker edge function for Lemon Squeezy and Stripe webhooks.
 * Validates HMAC signatures, extracts purchaser details, and mints offline Ed25519
 * digital license certificates (.rlkey) for RedactLocal customers.
 *
 * Zero-maintenance, sub-50ms execution, zero cloud database dependency.
 */

// --- Base64 & Hex Web-Standard Utility Helpers ---

export function uint8ArrayToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToUint8Array(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function hexToUint8Array(hex) {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function uint8ArrayToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// --- Key Management & Web Crypto Helpers ---

/**
 * Parses raw hex, PKCS#8 DER hex, base64, or PEM format into standard PKCS#8 DER bytes
 * suitable for crypto.subtle.importKey('pkcs8', ...).
 */
export function parsePrivateKeyToPkcs8(keyInput) {
  if (!keyInput) {
    throw new Error('ED25519_PRIVATE_KEY is not defined in environment');
  }

  let str = String(keyInput).trim();

  // Handle PEM format
  if (str.includes('BEGIN PRIVATE KEY')) {
    str = str
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s+/g, '');
    return base64ToUint8Array(str);
  }

  // Handle Hex formats
  const cleanHex = str.replace(/[^0-9a-fA-F]/g, '');
  if (cleanHex.length === 64) {
    // 32-byte raw Ed25519 private seed -> prepend standard 16-byte PKCS#8 prefix
    const ED25519_PKCS8_PREFIX_HEX = '302e020100300506032b657004220420';
    return hexToUint8Array(ED25519_PKCS8_PREFIX_HEX + cleanHex);
  }
  if (cleanHex.length === 96) {
    // 48-byte standard PKCS#8 DER
    return hexToUint8Array(cleanHex);
  }

  // Handle raw Base64
  try {
    const raw = base64ToUint8Array(str);
    if (raw.length === 32) {
      const prefix = hexToUint8Array('302e020100300506032b657004220420');
      const full = new Uint8Array(48);
      full.set(prefix, 0);
      full.set(raw, 16);
      return full;
    }
    if (raw.length === 48) {
      return raw;
    }
  } catch (_) {}

  throw new Error(
    `Unsupported ED25519_PRIVATE_KEY format (length ${str.length}). Expected 64-char hex seed, 96-char PKCS#8 hex, or PEM.`
  );
}

/**
 * Validates HMAC-SHA256 signature using constant-time Web Crypto API
 */
export async function verifyHmacSha256(secret, payloadBytes, signatureHex) {
  try {
    if (!secret || !signatureHex) return false;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = hexToUint8Array(signatureHex);
    return await crypto.subtle.verify('HMAC', key, sigBytes, payloadBytes);
  } catch (err) {
    return false;
  }
}

/**
 * Validates Stripe signature header (t=timestamp,v1=signature_hex)
 */
export async function verifyStripeSignature(secret, rawBody, signatureHeader, toleranceSeconds = 300) {
  if (!signatureHeader || !secret) return false;

  const parts = signatureHeader.split(',');
  let timestamp = null;
  const signatures = [];

  for (const part of parts) {
    const [k, v] = part.trim().split('=');
    if (k === 't') {
      timestamp = parseInt(v, 10);
    } else if (k === 'v1') {
      signatures.push(v);
    }
  }

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  // Tolerance check (anti-replay defense)
  if (toleranceSeconds > 0) {
    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - timestamp) > toleranceSeconds) {
      return false;
    }
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const enc = new TextEncoder();
  const payloadBytes = enc.encode(signedPayload);

  for (const sigHex of signatures) {
    const isValid = await verifyHmacSha256(secret, payloadBytes, sigHex);
    if (isValid) return true;
  }

  return false;
}

// --- Order Parsing & Tier Normalization ---

export function normalizeTierAndSeats(tierInput = '', explicitSeats = null) {
  const str = String(tierInput).toLowerCase().trim();
  let tier = 'founder_lifetime';
  let seats = 1;

  if (str.includes('site') || str.includes('enterprise') || str.includes('50')) {
    tier = 'site_50';
    seats = 50;
  } else if (str.includes('team_10') || str.includes('team 10') || str.includes('10 seats') || str.includes('firm')) {
    tier = 'team_10';
    seats = 10;
  } else if (str.includes('team_5') || str.includes('team 5') || str.includes('5 seats')) {
    tier = 'team_5';
    seats = 5;
  } else if (str.includes('pro') || str.includes('personal')) {
    tier = 'personal_lifetime';
    seats = 1;
  } else if (str.includes('founder')) {
    tier = 'founder_lifetime';
    seats = 1;
  } else if (str) {
    tier = str.replace(/[^a-z0-9_]/g, '_');
    seats = 1;
  }

  if (explicitSeats != null && !isNaN(Number(explicitSeats)) && Number(explicitSeats) > 0) {
    seats = Number(explicitSeats);
  }

  return { tier, seats };
}

export function parseLemonSqueezyOrder(payload) {
  const data = payload?.data || {};
  const attrs = data.attributes || {};
  const firstItem = attrs.first_order_item || {};
  const custom = payload?.meta?.custom_data || attrs.custom_data || {};

  const orderId =
    attrs.identifier ||
    (attrs.order_number ? `LS-${attrs.order_number}` : null) ||
    data.id ||
    custom.order_id ||
    `RL-LS-${Date.now()}`;

  const customerEmail =
    attrs.user_email ||
    attrs.customer_email ||
    custom.email ||
    'customer@example.com';

  const customerName =
    attrs.user_name ||
    attrs.customer_name ||
    custom.licensee ||
    custom.customer_name ||
    'Licensed User';

  const rawTier =
    custom.tier ||
    firstItem.variant_name ||
    firstItem.product_name ||
    'founder_lifetime';

  const { tier, seats } = normalizeTierAndSeats(rawTier, custom.seats);

  return {
    orderId,
    customerEmail,
    customerName,
    tier,
    seats
  };
}

export function parseStripeOrder(payload) {
  const obj = payload?.data?.object || {};
  const metadata = obj.metadata || {};
  const customerDetails = obj.customer_details || {};

  const orderId =
    obj.id ||
    obj.payment_intent ||
    metadata.order_id ||
    `RL-ST-${Date.now()}`;

  const customerEmail =
    customerDetails.email ||
    obj.customer_email ||
    obj.receipt_email ||
    metadata.email ||
    'customer@example.com';

  const customerName =
    customerDetails.name ||
    metadata.licensee ||
    metadata.customer_name ||
    'Licensed User';

  const rawTier =
    metadata.tier ||
    metadata.product_name ||
    obj.description ||
    'founder_lifetime';

  const { tier, seats } = normalizeTierAndSeats(rawTier, metadata.seats);

  return {
    orderId,
    customerEmail,
    customerName,
    tier,
    seats
  };
}

// --- Ed25519 License Minting ---

/**
 * Mints an offline-verifiable Ed25519 digital license (.rlkey)
 */
export async function mintEd25519License({ privateKeyHexOrPem, orderData }) {
  const pkcs8Der = parsePrivateKeyToPkcs8(privateKeyHexOrPem);
  const cryptoSubtle = globalThis.crypto?.subtle;

  if (!cryptoSubtle) {
    throw new Error('Web Crypto API (crypto.subtle) is unavailable in this runtime');
  }

  const privKey = await cryptoSubtle.importKey(
    'pkcs8',
    pkcs8Der,
    { name: 'Ed25519' },
    false,
    ['sign']
  );

  const {
    orderId,
    customerEmail,
    customerName,
    tier = 'founder_lifetime',
    seats = 1,
    expiresAt = null,
    features = {
      max_pages_per_doc: 999999,
      batch_processing: true,
      court_receipts: true,
      custom_regex_presets: true,
      air_gap_enforced: true
    }
  } = orderData;

  const licensePayload = {
    v: 1,
    app: 'RedactLocal',
    order_id: orderId || `RL-ORD-${Date.now()}`,
    licensee: customerName || 'Licensed User',
    email: customerEmail || 'customer@example.com',
    tier: tier,
    seats: Number(seats) || 1,
    issued_at: new Date().toISOString(),
    expires_at: expiresAt,
    features: features
  };

  const payloadStr = JSON.stringify(licensePayload);
  const payloadBytes = new TextEncoder().encode(payloadStr);
  const sigBuffer = await cryptoSubtle.sign('Ed25519', privKey, payloadBytes);
  const sigB64 = uint8ArrayToBase64(new Uint8Array(sigBuffer));

  const licenseCertificate = {
    ...licensePayload,
    sig: sigB64
  };

  const rawKeyFileContent = JSON.stringify(licenseCertificate, null, 2);
  const safeName = (customerName || 'license')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const filename = `redactlocal_${safeName || 'license'}.rlkey`;

  return {
    licenseCertificate,
    rawKeyFileContent,
    filename
  };
}

// --- Optional Transactional Email Delivery ---

export async function sendTransactionalEmail(env, { email, name, orderId, tier, filename, rawKeyFileContent }) {
  if (!email) {
    return { status: 'skipped', reason: 'No recipient email provided' };
  }

  const fromAddress = env.EMAIL_FROM || 'RedactLocal <licenses@redactlocal.com>';
  const keyBase64 = uint8ArrayToBase64(new TextEncoder().encode(rawKeyFileContent));
  const subject = `Your RedactLocal ${tier || 'Founder'} Digital License Key (.rlkey)`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="background: #0f172a; padding: 24px; border-radius: 8px; color: #fff; margin-bottom: 24px;">
    <h1 style="margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.02em;">RedactLocal</h1>
    <p style="margin: 4px 0 0; color: #94a3b8; font-size: 14px;">Zero-Network Air-Gapped PDF Redaction</p>
  </div>
  <h2 style="font-size: 18px; margin-top: 0;">Thank you for your purchase, ${name || 'Valued Customer'}!</h2>
  <p>Your order <strong>${orderId}</strong> has been fulfilled. Attached is your official Ed25519 cryptographic keycard: <code>${filename}</code>.</p>
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
    <h3 style="margin-top: 0; font-size: 15px;">How to activate RedactLocal:</h3>
    <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #334155;">
      <li>Open RedactLocal in your browser or desktop app.</li>
      <li>Click <strong>License &amp; Settings</strong> or drag your <code>.rlkey</code> file directly onto the window.</li>
      <li>Your license will verify 100% locally and offline via Ed25519 Web Crypto.</li>
    </ol>
  </div>
  <p style="font-size: 13px; color: #64748b;">Keep this email and your <code>.rlkey</code> file in a safe place. RedactLocal operates without cloud telemetry, so your license file is your permanent proof of ownership.</p>
</body>
</html>
`.trim();

  // 1. Resend Integration
  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [email],
          subject: subject,
          html: htmlBody,
          attachments: [
            {
              filename: filename,
              content: keyBase64
            }
          ]
        })
      });
      const data = await res.json();
      return { status: res.ok ? 'sent' : 'failed', provider: 'resend', response: data };
    } catch (err) {
      return { status: 'error', provider: 'resend', error: err.message };
    }
  }

  // 2. Postmark Integration
  if (env.POSTMARK_SERVER_TOKEN) {
    try {
      const res = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'X-Postmark-Server-Token': env.POSTMARK_SERVER_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          From: fromAddress,
          To: email,
          Subject: subject,
          HtmlBody: htmlBody,
          Attachments: [
            {
              Name: filename,
              Content: keyBase64,
              ContentType: 'application/json'
            }
          ]
        })
      });
      const data = await res.json();
      return { status: res.ok ? 'sent' : 'failed', provider: 'postmark', response: data };
    } catch (err) {
      return { status: 'error', provider: 'postmark', error: err.message };
    }
  }

  return { status: 'skipped', reason: 'No transactional email API key configured (RESEND_API_KEY / POSTMARK_SERVER_TOKEN)' };
}

// --- Webhook Endpoint Handlers ---

export async function handleLemonSqueezyWebhook(request, env) {
  if (!env.LEMONSQUEEZY_WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Server configuration error: missing LEMONSQUEEZY_WEBHOOK_SECRET' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!env.ED25519_PRIVATE_KEY) {
    return new Response(JSON.stringify({ error: 'Server configuration error: missing ED25519_PRIVATE_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const rawBody = await request.text();
  const signatureHex = request.headers.get('x-signature') || '';

  if (!signatureHex) {
    return new Response(JSON.stringify({ error: 'Missing x-signature header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const isValid = await verifyHmacSha256(
    env.LEMONSQUEEZY_WEBHOOK_SECRET,
    new TextEncoder().encode(rawBody),
    signatureHex
  );

  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid HMAC signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const eventName = payload?.meta?.event_name || request.headers.get('x-event-name');
  if (eventName && eventName !== 'order_created') {
    return new Response(JSON.stringify({
      status: 'ignored',
      message: `Event "${eventName}" received; only "order_created" triggers license fulfillment.`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const orderData = parseLemonSqueezyOrder(payload);
  const minted = await mintEd25519License({
    privateKeyHexOrPem: env.ED25519_PRIVATE_KEY,
    orderData
  });

  const emailDelivery = await sendTransactionalEmail(env, {
    email: orderData.customerEmail,
    name: orderData.customerName,
    orderId: orderData.orderId,
    tier: orderData.tier,
    filename: minted.filename,
    rawKeyFileContent: minted.rawKeyFileContent
  });

  return new Response(JSON.stringify({
    success: true,
    provider: 'lemonsqueezy',
    order_id: orderData.orderId,
    licensee: orderData.customerName,
    email: orderData.customerEmail,
    tier: orderData.tier,
    seats: orderData.seats,
    filename: minted.filename,
    license: minted.licenseCertificate,
    rawKeyFileContent: minted.rawKeyFileContent,
    email_delivery: emailDelivery
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function handleStripeWebhook(request, env) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Server configuration error: missing STRIPE_WEBHOOK_SECRET' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!env.ED25519_PRIVATE_KEY) {
    return new Response(JSON.stringify({ error: 'Server configuration error: missing ED25519_PRIVATE_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get('stripe-signature') || '';

  if (!signatureHeader) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const tolerance = env.STRIPE_TOLERANCE_SECONDS ? parseInt(env.STRIPE_TOLERANCE_SECONDS, 10) : 300;
  const isValid = await verifyStripeSignature(
    env.STRIPE_WEBHOOK_SECRET,
    rawBody,
    signatureHeader,
    tolerance
  );

  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid Stripe signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const eventType = payload?.type;
  const allowableEvents = ['checkout.session.completed', 'payment_intent.succeeded'];
  if (eventType && !allowableEvents.includes(eventType)) {
    return new Response(JSON.stringify({
      status: 'ignored',
      message: `Event "${eventType}" received; only checkout completion triggers license fulfillment.`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const orderData = parseStripeOrder(payload);
  const minted = await mintEd25519License({
    privateKeyHexOrPem: env.ED25519_PRIVATE_KEY,
    orderData
  });

  const emailDelivery = await sendTransactionalEmail(env, {
    email: orderData.customerEmail,
    name: orderData.customerName,
    orderId: orderData.orderId,
    tier: orderData.tier,
    filename: minted.filename,
    rawKeyFileContent: minted.rawKeyFileContent
  });

  return new Response(JSON.stringify({
    success: true,
    provider: 'stripe',
    order_id: orderData.orderId,
    licensee: orderData.customerName,
    email: orderData.customerEmail,
    tier: orderData.tier,
    seats: orderData.seats,
    filename: minted.filename,
    license: minted.licenseCertificate,
    rawKeyFileContent: minted.rawKeyFileContent,
    email_delivery: emailDelivery
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// --- Default Cloudflare Worker Export ---

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Health check
    if (pathname === '/' || pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'RedactLocal Webhook Fulfillment Engine',
        runtime: 'cloudflare_worker',
        timestamp: new Date().toISOString()
      }, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Lemon Squeezy webhook endpoint
    if (pathname === '/webhook/lemonsqueezy' || pathname === '/lemonsqueezy') {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json', 'Allow': 'POST' }
        });
      }
      return handleLemonSqueezyWebhook(request, env);
    }

    // Stripe webhook endpoint
    if (pathname === '/webhook/stripe' || pathname === '/stripe') {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json', 'Allow': 'POST' }
        });
      }
      return handleStripeWebhook(request, env);
    }

    return new Response(JSON.stringify({ error: 'Not found', path: pathname }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
