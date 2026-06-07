# Razorpay — test to live payments

Marvel Rocks uses the **same API** for web and (future) Android. Enable live payments on the **website first** — you do not need to wait for the mobile app.

## Recommended order

| Step | When | Why |
|------|------|-----|
| 1. Test keys on production API | **Now** | Verify Pay Now, receipts, and Collection Dashboard with fake money |
| 2. Complete Razorpay KYC | Before live | Required for `rzp_live_` keys |
| 3. Swap to live keys on Azure | When KYC approved | Real UPI / cards / net banking |
| 4. Configure webhook | With live (or test) | Marks bills paid even if the browser closes after payment |
| 5. Android app | Later | Reuses `POST /bills/{id}/razorpay-order` and `razorpay-verify` |

## What is already built

- **Resident:** Pay Now on Maintenance → Razorpay checkout → PDF receipt
- **Admin:** Collection Dashboard, mark cash, monthly summary
- **API:** `POST /bills/{id}/razorpay-order`, `POST /bills/{id}/razorpay-verify`, `POST /webhooks/razorpay`
- **Status:** `GET /bills/payment-config` returns `enabled`, `mode` (`test` / `live` / `off`)

## Step 1 — Test on production (you can do this today)

1. [Razorpay Dashboard](https://dashboard.razorpay.com) → **Test mode** → **API Keys**
2. Copy **Key ID** (`rzp_test_…`) and **Key Secret**
3. Azure → App Service **marvelrocks-api** → **Environment variables**:

   | Name | Value |
   |------|--------|
   | `RAZORPAY_KEY_ID` | `rzp_test_…` |
   | `RAZORPAY_KEY_SECRET` | (secret) |

4. **Save** → **Restart** the app (required after every API deploy)
5. Open [https://www.marvelrocks.in](https://www.marvelrocks.in) → log in as a resident with a pending bill → **Pay Now**
6. Use Razorpay test card: `4111 1111 1111 1111`, any future expiry, any CVV

The site shows a **Test payment mode** banner when test keys are active.

## Step 2 — Go live (real money)

### 2.1 Complete KYC

1. Razorpay Dashboard → switch to **Live mode**
2. Complete **Account & Settings → KYC** (PAN, bank account, society/association details)
3. Wait for approval (usually 1–3 business days)

### 2.2 Live API keys on Azure

1. Dashboard → **Live mode** → **API Keys** → generate if needed
2. Update Azure App Service settings:

   | Name | Value |
   |------|--------|
   | `RAZORPAY_KEY_ID` | `rzp_live_…` |
   | `RAZORPAY_KEY_SECRET` | live secret |

3. **Restart** `marvelrocks-api`
4. Confirm `GET https://api.marvelrocks.in/bills/payment-config` shows `"mode": "live"`

### 2.3 Razorpay dashboard settings

- **Website / app URL:** `https://www.marvelrocks.in`
- No code change needed for domain — checkout runs on Razorpay’s hosted page

### 2.4 Webhook (recommended for production)

1. Dashboard → **Settings** → **Webhooks** → **Add new webhook**
2. **Webhook URL:** `https://api.marvelrocks.in/webhooks/razorpay`
3. **Active events:** `payment.captured`
4. Copy the **Webhook secret**
5. Add to Azure:

   | Name | Value |
   |------|--------|
   | `RAZORPAY_WEBHOOK_SECRET` | (secret from dashboard) |

6. **Restart** the API again

If a resident pays but closes the tab before verification, the webhook still marks the bill **PAID**.

## Step 3 — Android (later)

The Android app will call the same endpoints:

1. `POST /bills/{billId}/razorpay-order` (with JWT) → get `order_id` and `key_id`
2. Open Razorpay Android SDK with that order
3. `POST /bills/{billId}/razorpay-verify` with payment id + signature

Use the **same live keys** on the API — no separate Razorpay setup for Android beyond the mobile SDK.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Pay Now says “not configured” | Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` on Azure and **restart** |
| Payment works but bill still pending | Check API logs; add webhook; user can retry verify (idempotent if already paid) |
| Still shows test banner after live keys | Hard refresh (Ctrl+F5); confirm key starts with `rzp_live_` |
| Webhook 400 invalid signature | `RAZORPAY_WEBHOOK_SECRET` must match the secret shown in Razorpay for that webhook URL |

## Local development

Copy `python_app/.env.example` to `python_app/.env` and set test keys. Never commit `.env` or live secrets to Git.
