# RedactLocal Payment Webhook Fulfillment Engine Deployment Guide

A turn-key, serverless webhook fulfillment engine running on **Cloudflare Workers** edge infrastructure.

Upon checkout completion in **Lemon Squeezy** or **Stripe**, this edge worker validates HMAC signatures, mints a cryptographic **Ed25519 digital license file (`.rlkey`)**, and optionally delivers it to the customer via transactional email (Resend / Postmark).

```
   [Customer Checkout]
     │ (Lemon Squeezy / Stripe)
     ▼
┌────────────────────────────────────────────────────────┐
│  Cloudflare Worker: core/engine/cloudflare_worker.js   │
│  • HMAC-SHA256 signature verification (constant-time)  │
│  • Extract order ID, customer name, email, tier, seats │
│  • Ed25519 asymmetric signature using Authority Key    │
│  • Generates signed .rlkey certificate payload         │
│  • (Optional) Delivers keycard via Resend / Postmark   │
└────────────────────────────┬───────────────────────────┘
                             │ Returns .rlkey JSON
                             ▼
┌────────────────────────────────────────────────────────┐
│  Client App (Browser PWA / macOS App / Windows)        │
│  • Offline verification via core/engine/license_verifier.js
│  • Web Crypto Ed25519 public key verification          │
│  • ZERO network calls, zero phone-home, 100% air-gapped│
└────────────────────────────────────────────────────────┘
```

---

## ⏱️ 3-Minute Quickstart

### Step 1: Create `wrangler.toml`

Place a `wrangler.toml` file in the root of your project:

```toml
name = "redactlocal-fulfillment"
main = "core/engine/cloudflare_worker.js"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[vars]
EMAIL_FROM = "RedactLocal <licenses@redactlocal.com>"
STRIPE_TOLERANCE_SECONDS = "300"
```

---

### Step 2: Configure Environment Secrets

Provision your production secrets directly in Cloudflare via `wrangler secret put`:

#### 1. Master Ed25519 Private Authority Key (Required)
Extract the 32-byte private seed hex from `keys/authority_private.key`:
```bash
# Extract hex seed from your master key:
node -e "
const fs = require('fs');
const crypto = require('crypto');
const pem = fs.readFileSync('keys/authority_private.key', 'utf8');
const privKey = crypto.createPrivateKey(pem);
const der = privKey.export({ format: 'der', type: 'pkcs8' });
console.log(der.subarray(der.length - 32).toString('hex'));
" | npx wrangler secret put ED25519_PRIVATE_KEY
```
*(Alternatively, you can paste the entire PEM file contents into `ED25519_PRIVATE_KEY`)*.

#### 2. Lemon Squeezy Webhook Secret (Required for Lemon Squeezy)
Generate a random high-entropy secret string and register it:
```bash
npx wrangler secret put LEMONSQUEEZY_WEBHOOK_SECRET
```

#### 3. Stripe Webhook Secret (Required for Stripe)
Obtain your webhook signing secret (`whsec_...`) from Stripe Dashboard and set it:
```bash
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

#### 4. Transactional Email API Key (Optional)
If you wish to auto-dispatch keycards via email to the customer upon purchase:
```bash
# For Resend (https://resend.com):
npx wrangler secret put RESEND_API_KEY

# OR for Postmark (https://postmarkapp.com):
npx wrangler secret put POSTMARK_SERVER_TOKEN
```

---

### Step 3: Run the Automated Verification Suite

Before deploying, run the full verification test suite locally:
```bash
node scripts/simulate_webhook_purchase.mjs
```
Expected output:
```
✓ ALL 41/41 TESTS PASSED 100%!
Offline Ed25519 Digital License Engine is Production-Ready.
```

---

### Step 4: Deploy to Cloudflare Workers

Deploy your worker globally in one command:
```bash
npx wrangler deploy
```

Wrangler outputs your live edge URL:
```
Uploaded redactlocal-fulfillment (1.2 sec)
Deployed redactlocal-fulfillment triggers:
  https://redactlocal-fulfillment.<your-subdomain>.workers.dev
```

Test the live health endpoint:
```bash
curl https://redactlocal-fulfillment.<your-subdomain>.workers.dev/health
# Response: {"status":"ok","service":"RedactLocal Webhook Fulfillment Engine",...}
```

---

## 🔗 Merchant Webhook Configuration

### 1. Lemon Squeezy Configuration
1. Go to **Lemon Squeezy Dashboard** > **Settings** > **Webhooks**.
2. Click **Create Webhook**.
3. **Callback URL**: `https://redactlocal-fulfillment.<your-subdomain>.workers.dev/webhook/lemonsqueezy`
4. **Signing Secret**: Enter the exact secret string you configured in `LEMONSQUEEZY_WEBHOOK_SECRET`.
5. **Events to Send**: Select `order_created`.
6. Save and test with Lemon Squeezy's "Send Test Webhook" button.

### 2. Stripe Configuration
1. Go to **Stripe Dashboard** > **Developers** > **Webhooks**.
2. Click **Add destination**.
3. **Endpoint URL**: `https://redactlocal-fulfillment.<your-subdomain>.workers.dev/webhook/stripe`
4. **Events to Send**: Select `checkout.session.completed`.
5. Copy the **Signing secret** (`whsec_...`) and store it in `STRIPE_WEBHOOK_SECRET`.

---

## 🛡️ License Tiers & Seat Allocations

The worker automatically resolves customer tiers and seats:

| Product Variant / Tier String | License Tier | Seat Count | Features |
| :--- | :--- | :--- | :--- |
| `Founder Lifetime ($39)` | `founder_lifetime` | 1 | Unlimited pages, batch, court receipts, air-gapped |
| `Personal Lifetime ($49)` | `personal_lifetime` | 1 | Unlimited pages, batch, court receipts, air-gapped |
| `Team (5 Seats)` ($99) | `team_5` | 5 | Multi-seat firm license |
| `Team (10 Seats)` ($199) | `team_10` | 10 | Multi-seat firm license |
| `Site License (50 Seats)` ($499) | `site_50` | 50 | Enterprise / firm-wide license |

Custom tier overrides can also be passed via metadata:
- Lemon Squeezy: `meta.custom_data.tier` and `meta.custom_data.seats`
- Stripe: `metadata.tier` and `metadata.seats`

---

## 🔒 Security Architecture: Zero-Trust Offline Verification

1. **Constant-time HMAC verification:** Prevents timing attacks on incoming webhooks from Lemon Squeezy or Stripe.
2. **Asymmetric Ed25519 Signatures:** The server signs with the private authority key. The client application only embeds the public key (`core/engine/authority_key.js`).
3. **No Database Risk:** The license file itself carries its cryptographic proof. If RedactLocal's servers go down, existing licenses remain 100% valid forever.
4. **Zero-Network Verification:** The client application verifies the license using browser/webview standard `crypto.subtle.verify('Ed25519', ...)` without ever sending network requests or analytics pingbacks.
