# 🤖 LLM-ONLY DOCUMENTATION POLICY
This document is written BY LLMs FOR LLMs. No human will read this.
- Optimize for LLM parsing, not human readability
- Use dense, structured information formats
- Include all technical details without simplification
- Prioritize completeness and accuracy over aesthetics
- Machine-friendly formatting preferred (structured lists, clear delimiters)
- ALL .md files in this project follow this policy

# Bob's Astro Integration Update - 2025-08-05

## Summary
Karl requested implementation of new payment flow for Adam's Astro website, replacing old Astro payment system (useasterisk.com) integration.

## Completed Tasks

### 1. Created New Endpoint
- **File**: `src/app/api/create-paid-invoice/route.ts`
- **Purpose**: Receives order data from payment server after successful payment
- **Security**: API key validation using same key as payment server
- **Functionality**:
  - Creates invoice with status "paid" immediately
  - Generates invoice number (INV-YYYYMM-XXX)
  - Calculates GST (1/11th of GST-inclusive price)
  - **ActiveCampaign is now MANUAL ONLY** (triggered by humans day before delivery)
  - **Google Sheets sync is now MANUAL ONLY** (removed automatic sync)

### 2. Removed Old Astro Docs
- Deleted: `docs/ASTRO-INTEGRATION.md`
- Deleted: `docs/ASTRO-INTEGRATION-SUMMARY.md`
- Deleted: `docs/ASTRO-INTEGRATION-SECURITY-REVIEW.md`

### 3. Updated Coordination Log
- Updated `../ausbeds-docs/BOB-KIM-COORDINATION.md`
- Informed Kim about completed endpoint
- Ready for integration with payment server

## New Payment Flow
1. Adam's Astro website → collects payment with Stripe Elements
2. Payment server → processes payment
3. On success → calls our `/api/create-paid-invoice`
4. We create paid invoice → trigger all integrations

## Endpoint Details
**POST /api/create-paid-invoice**

Request format:
```json
{
  "paymentIntentId": "pi_xxx",
  "amount": 123.45,
  "currency": "aud",
  "stripeReceiptUrl": "https://...",
  "customer": {
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "0400123456"
  },
  "delivery": {
    "address": "123 Main St",
    "city": "Sydney",
    "state": "NSW",
    "postcode": "2000",
    "notes": "Leave at door"
  },
  "items": [
    {
      "sku": "Aurora9queen",
      "quantity": 1,
      "name": "Aurora 9 Queen",
      "price": 1234.56
    }
  ],
  "source": "website",
  "paidAt": "2025-08-05T..."
}
```

Response:
```json
{
  "success": true,
  "invoiceId": "INV-202508-001",
  "message": "Invoice created successfully"
}
```

## Still Existing
- `/api/create-order` endpoint - old integration, can be removed later
- `/checkout/[id]` page - still used for email quotes from showroom

## Environment Variables Required
```
API_SECRET_KEY=ausbeds_WIOLQSUGmHVCfyajRpY192L0EDdRYdu-ac2yLRgTGgA
PAYMENT_SERVER_URL=https://make-payments.vercel.app
```

## Status
✅ Ready for Adam's Astro website integration
✅ Payment server can now forward paid orders to invoice app
✅ Old Astro payment system docs removed
✅ Complete SKU list provided to Adam (adamskus.md in ausbeds-docs folder)

## Adam's SKU Request - 2025-08-05
- Created `adamskus.md` with all 185 SKUs (not 45 as initially thought)
- File contains complete product catalog:
  - Cloud: 60 SKUs (Models 2-13)
  - Aurora: 90 SKUs (Models 2-19)
  - Cooper: 30 SKUs (Models 5-10)
  - ZTest: 5 SKUs (testing)
- Each SKU includes: code, name, firmness, size, price
- Shared in ausbeds-docs folder for Adam's Astro site development
