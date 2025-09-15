# CLAUDE.md - Invoice App (Monorepo)

This file provides guidance to Claude Code when working with the Invoice app in the monorepo.

## Location
Part of monorepo at: `ausbeds-monorepo/apps/invoice/`

## CRITICAL: BUSINESS CONTEXT
Invoice management system for Ausbeds mattress business. Each sale averages $3000. Part of a three-app architecture where disruptions directly impact revenue.

## MONOREPO CONTEXT
See root CLAUDE.md at `ausbeds-monorepo/CLAUDE.md` for:
- Overall architecture
- Gordon's rules
- Development commands
- Deployment strategy

## ARCHITECTURE OVERVIEW

### THREE-APP SYSTEM:
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   ASTRO:4321    │────▶│ INVOICE:7002    │────▶│ PAYMENT:3005    │
│                 │     │                 │     │                 │
│ • Product pages │     │ • Quote/Invoice │     │ • Stripe API    │
│ • Shopping cart │     │ • Checkout UI   │     │ • Webhooks      │
│ • Product data  │     │ • Database      │     │ • Payment intent│
└─────────────────┘     │ • Email sending │     └─────────────────┘
                        └─────────────────┘
                                ▲
                                │
                        ┌───────────────┐
                        │ Customer Email │
                        │ (Direct link)  │
                        └───────────────┘
```

Invoice-app handles:
- Invoice creation from Stripe webhooks
- Quote generation and management
- Customer email notifications
- Database operations (Vercel Postgres)
- External integrations (Google Sheets, ActiveCampaign, Zapier, WooCommerce)

## DEVELOPMENT COMMANDS

```bash
# Start development (enforces port 7002)
npm run dev              # Runs ./scripts/start-dev.sh with port cleanup

# Alternative start commands
npm run dev:next         # Standard Next.js dev server
npm run dev:force        # Force port 7002

# Build and production
npm run build           # Build for production
npm run start           # Start production server

# Code quality
npm run lint            # Run ESLint
```

## DATABASE SCHEMA

Vercel Postgres tables:
- `quotes` - Invoices with status tracking, payment info, soft delete support
  - Fields: quote_number (INV-YYYYMM-XXX format), customer details, items (JSONB), GST/totals, status, payment_status, stripe_payment_intent_id, delivery_access, timestamps, deleted_at
- `customers` - Customer records with contact details
  - Fields: name, email (unique), phone, address, timestamps
- `payments` - Stripe payment records linked to quotes
  - Fields: quote_id (FK), stripe_payment_intent_id, amount, currency, status, payment_method, created_at

## ⚠️ CRITICAL: DATABASE TYPE CONVERSION (MUST READ)

**PROBLEM**: Vercel Postgres returns DECIMAL/NUMERIC fields as STRINGS, not numbers!
This causes runtime errors like `TypeError: total.toFixed is not a function`

**AFFECTED FIELDS**:
- `quotes.total` - Returns as string (e.g., "2999.00")
- `quotes.subtotal` - Returns as string
- `quotes.gst` - Returns as string  
- `items[].price` - Each item price returns as string

**REQUIRED FIX**: Always convert database numeric values using `parseFloat()`:
```javascript
// WRONG - Will cause runtime error
const displayTotal = quoteData.total.toFixed(2);

// CORRECT - Convert string to number first
const quoteData = {
  ...data,
  total: parseFloat(data.total || 0),
  subtotal: parseFloat(data.subtotal || 0),
  gst: parseFloat(data.gst || 0),
  items: data.items?.map(item => ({
    ...item,
    price: parseFloat(item.price || 0),
    quantity: parseInt(item.quantity || 1)
  }))
};
const displayTotal = quoteData.total.toFixed(2);
```

**WHERE TO APPLY**:
- Any component receiving quote data from API
- `/checkout/[id]/page.tsx` - When fetching quote
- `CheckoutTemplate.tsx` - When using initialQuote prop
- `PaymentForm.tsx` - When calculating totals
- Any place using `.toFixed()`, math operations, or number comparisons

## CRITICAL API ENDPOINTS

### POST /api/create-paid-invoice
Creates invoice from Stripe webhook. Requires `X-API-Key` header matching `API_SECRET_KEY`.
- Generates sequential invoice number (INV-YYYYMM-XXX)
- Calculates GST (1/11 of total)
- Sends customer email via Nodemailer
- Updates database with payment confirmation

### POST /api/quotes
Creates draft quotes/invoices with proper GST calculation and customer details.

### GET /api/quotes/[id]
Public invoice retrieval by ID or quote number.

### DELETE /api/quotes/[id]
Soft delete quote by marking deleted_at timestamp.

### POST /api/quotes/bulk-delete
Batch soft delete multiple quotes.

### POST /api/send-quote
Email quote to customer with PDF attachment.

### POST /api/zapier-webhook
External automation trigger with invoice data.

### POST /api/bobs-woocommerce-endpoint
WooCommerce integration for order processing.

### POST /api/sync-sheets
Manual Google Sheets synchronization trigger.

### POST /api/activecampaign
Customer CRM updates via ActiveCampaign API.

### POST /api/create-payment-intent
Creates Stripe payment intent (proxies to payment-app).

### POST /api/init-db
Initialize database tables (development utility).

## HIGH-RISK FILES
```
/src/app/api/create-paid-invoice/route.ts  # Payment webhook handler
/src/services/invoiceService.ts            # Core business logic
/lib/db.ts                                 # Database operations
/src/app/api/zapier-webhook/route.ts      # External integrations
/src/app/api/bobs-woocommerce-endpoint/route.ts # WooCommerce sync
```

## GST CALCULATION (Australian Law)
```javascript
// GST is 1/11 of GST-inclusive total
const gstAmount = total / 11;
const subtotal = total - gstAmount;
// Never use 10% on exclusive amount
```

## ENVIRONMENT VARIABLES
Required in `.env.local`:
```
DATABASE_URL                      # Vercel Postgres connection
API_SECRET_KEY                    # Internal auth (must match payment-app)
PAYMENT_SERVER_URL               # Payment app URL (default: http://localhost:3005)
GMAIL_USER                       # Email sending account
GMAIL_APP_PASSWORD              # Gmail app-specific password
GOOGLE_SHEETS_ID                # Optional: Sheets sync
GOOGLE_SHEETS_CREDENTIALS       # Optional: Service account JSON
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY # Stripe public key
ACTIVECAMPAIGN_URL              # Optional: ActiveCampaign API
ACTIVECAMPAIGN_API_KEY         # Optional: ActiveCampaign auth
```

## TESTING REQUIREMENTS
Before any deployment:
1. Test complete $3000 purchase flow locally
2. Verify webhook with: `stripe listen --forward-to localhost:3005/api/stripe-webhook`
3. Confirm invoice generation and email delivery
4. Verify GST calculations (must be 1/11 of total)
5. Ensure all builds succeed: `npm run build`
6. Test database operations and soft delete functionality

## PORT MANAGEMENT
- **ALWAYS runs on port 7002** (enforced by start script)
- `npm run dev` automatically kills existing port 7002 processes
- Script location: `./scripts/start-dev.sh`
- Never use other ports for this app

## INTEGRATIONS
- **Stripe**: Via payment-app proxy (never direct)
- **Email**: Nodemailer with Gmail SMTP
- **Google Sheets**: Optional manual sync via service account
- **ActiveCampaign**: Optional CRM updates via API
- **Zapier**: Webhook for external automations
- **WooCommerce**: Order sync endpoint

## COMMON ISSUES

### Invoice not creating
1. Check Vercel logs for webhook errors
2. Verify API_SECRET_KEY matches between apps
3. Check database connection and tables exist
4. Verify Stripe webhook is forwarding correctly
5. Use Stripe Dashboard for manual recovery

### Port 7002 conflict
Use `npm run dev` which auto-kills existing processes via `./scripts/start-dev.sh`

### Email failures
1. Verify Gmail credentials in environment
2. Check app-specific password is valid
3. Review Nodemailer configuration
4. Check recipient email format

### Database issues
1. Verify DATABASE_URL is set correctly
2. Run `/api/init-db` endpoint once to create tables
3. Check Vercel Postgres dashboard for connection issues

## DEPLOYMENT
- Auto-deploys to Vercel on push to main branch
- Production URL: `invoice-app-ausbeds.vercel.app`
- Deploy order: payment-app → invoice-app → astro
- Monitor Vercel Dashboard for build status and errors

## MONITORING
- **Vercel Dashboard**: Real-time logs, errors, and function metrics
- **Stripe Dashboard**: Payment events and webhook deliveries
- **Database**: Vercel Postgres dashboard for queries and connections
- **Email**: Check Gmail sent folder for delivery confirmation

## CUSTOMER PAYMENT FLOW MAP

### TWO ENTRY POINTS:

```mermaid
graph TD
    %% Entry Point 1: Astro Website
    AstroStart[Customer on Astro site:4321] --> AddCart[Add items to cart]
    AddCart --> AstroCheckout[Click checkout button]
    AstroCheckout --> CreateQuote[Create draft quote via API]
    CreateQuote --> InvoiceApp[invoice-app:7002/api/quotes]
    
    %% Entry Point 2: Email Quote
    EmailStart[Customer receives quote email] --> ClickLink[Clicks checkout link]
    
    %% Both paths converge here
    InvoiceApp --> QuoteCreated[Quote created in DB]
    QuoteCreated --> RedirectCheckout[Redirect to /checkout/ID]
    ClickLink --> RedirectCheckout
    
    %% Main checkout flow
    RedirectCheckout --> Load[/checkout/ID page loads]
    Load --> Fetch[Fetch quote from API]
    Fetch --> Convert[⚠️ CONVERT STRING TO NUMBER]
    Convert --> Display[Display CheckoutTemplate]
    
    Display --> Step1[Step 1: Review Order]
    Step1 --> Step2[Step 2: Enter Details]
    Step2 --> Step3[Step 3: Payment]
    
    Step3 --> CreateIntent[Create payment intent]
    CreateIntent --> PaymentServer[payment-app:3005]
    PaymentServer --> Stripe[Stripe API]
    
    Stripe --> Elements[Load Stripe Elements]
    Elements --> Submit[Customer submits payment]
    
    Submit --> Process[Process payment]
    Process --> Webhook[Stripe webhook → invoice-app:7002]
    Webhook --> Invoice[Create paid invoice]
    Invoice --> Email[Send confirmation email]
    Email --> Success[Success page]
    
    %% Show the two apps
    style AstroStart fill:#ff6b6b
    style EmailStart fill:#4ecdc4
    style InvoiceApp fill:#95e77e
    style PaymentServer fill:#ffe66d
```

### ENTRY POINTS EXPLAINED:

**1. ASTRO WEBSITE (astro:4321)**
- Customer browses products on Astro site
- Adds items to cart (stored in localStorage)
- Clicks checkout → Creates draft quote via API
- Redirects to invoice-app checkout page

**2. EMAIL QUOTE (Direct link)**
- Admin creates quote in invoice-app dashboard
- Sends quote email to customer
- Customer clicks "Complete Your Purchase" button
- Goes directly to invoice-app checkout page

**Both paths use the same checkout flow after quote creation!**

### CRITICAL POINTS OF FAILURE:

1. **Database Type Conversion** (Line: Convert)
   - MUST convert string decimals to numbers
   - Failure causes: TypeError crashes
   - Affects BOTH entry points

2. **Payment Intent Creation** (Line: CreateIntent)
   - Requires valid customer email/name
   - Must calculate correct total with delivery fees
   - API_SECRET_KEY must match between apps

3. **Webhook Processing** (Line: Webhook)
   - Must verify Stripe signature
   - Database must be accessible
   - Email credentials must be valid

4. **Cross-Origin Issues** (Astro → Invoice-app)
   - CORS must be configured correctly
   - API endpoints must accept Astro origin
   - Cookies/sessions don't transfer between apps

### TESTING CHECKLIST:
```bash
# 1. Test quote API returns correct data
curl https://invoice-app-ausbeds.vercel.app/api/quotes/[ID]

# 2. Verify numeric conversions work
# Check that total displays as $X.XX not errors

# 3. Test payment flow
stripe listen --forward-to localhost:3005/api/stripe-webhook

# 4. Verify email sends
# Check Gmail sent folder after test purchase

# 5. Check success redirect
# Should go to /payment/success?quote=INV-XXXXXX-XXX
```

### COMMON ISSUES & FIXES:

| Issue | Symptom | Fix |
|-------|---------|-----|
| TypeError: toFixed not a function | Page crashes on load | Add parseFloat() conversions |
| Payment intent fails | "Failed to initialize payment" | Check customer details exist |
| Webhook not received | No invoice created | Verify API_SECRET_KEY matches |
| Email not sent | No confirmation | Check Gmail app password |
| Wrong total charged | Price mismatch | Include delivery fees in calculation |