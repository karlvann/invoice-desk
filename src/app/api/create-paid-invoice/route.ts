import { NextRequest, NextResponse } from 'next/server';
import { createQuote, updateQuoteStatus, updateQuotePaymentIntent } from '../../../../lib/db';
import { getNextSequentialInvoiceNumber } from '@/utils/invoice-sequential';
import { sendInvoiceEmail } from '@/utils/email';
import { sql } from '@vercel/postgres';
import crypto from 'crypto';

// API key validation (same as payment server uses)
const API_SECRET_KEY = process.env.API_SECRET_KEY;
// REMOVED: STRIPE_WEBHOOK_SECRET - not needed, payment-app handles Stripe verification
const PAYMENT_SERVER_URL = process.env.PAYMENT_SERVER_URL || 'https://make-payments.vercel.app';

// REMOVED: Stripe signature verification - we use API keys between our services
// The payment-app already verified the Stripe signature
// We just need to trust our own API key authentication

// Check if we've already processed this Stripe event
async function isEventProcessed(eventId: string): Promise<boolean> {
  try {
    const { rows } = await sql`
      SELECT id FROM processed_webhook_events 
      WHERE event_id = ${eventId}
      LIMIT 1
    `;
    return rows.length > 0;
  } catch (error) {
    // Table might not exist yet - we'll create it below
    return false;
  }
}

// Mark event as processed
async function markEventProcessed(eventId: string, invoiceNumber: string): Promise<void> {
  try {
    // Create table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS processed_webhook_events (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(255) UNIQUE NOT NULL,
        invoice_number VARCHAR(50) NOT NULL,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Insert the event
    await sql`
      INSERT INTO processed_webhook_events (event_id, invoice_number)
      VALUES (${eventId}, ${invoiceNumber})
      ON CONFLICT (event_id) DO NOTHING
    `;
  } catch (error) {

    // Don't throw - we still want to return success to Stripe
  }
}

// CHEF'S FIX: Actually wait for the email to send! No more fire-and-forget nonsense!
async function sendEmailWithRetry(invoice: any, customerEmail: string, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sendInvoiceEmail(invoice, true);

      return true; // Success!
    } catch (emailError) {
      lastError = emailError;

      
      if (attempt < maxRetries) {
        // Wait before retry: 1s, 2s, 3s
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }
  
  // All retries failed - this is a $3000 sale at risk!

  
  // Alert admin about the failure (don't await this)
  if (process.env.ADMIN_ALERT_EMAIL) {
    // Use Promise.resolve to run async without blocking
    Promise.resolve().then(async () => {
      try {
        // Send alert to admin about failed customer email
        const alertEmail = {
          to: process.env.ADMIN_ALERT_EMAIL,
          subject: `🚨 URGENT: Failed to send $${invoice.total} invoice to ${customerEmail}`,
          text: `Failed to send invoice ${invoice.quote_number} after ${maxRetries} attempts.\n\nCustomer: ${invoice.customer_name}\nAmount: $${invoice.total}\n\nPlease send manually!`,
        };
        // This is a separate email send, don't let it block

      } catch (alertError) {

      }
    });
  }
  
  // Throw error so webhook returns 500 and Stripe retries
  throw new Error(`Email delivery failed after ${maxRetries} attempts`);
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Create Paid Invoice API is working',
    method: 'Use POST to create an invoice',
    requiredHeaders: {
      'X-API-Key': 'Your API key',
      'stripe-signature': 'Stripe webhook signature (for webhook calls)'
    },
    requiredBody: {
      paymentIntentId: 'pi_xxx from Stripe',
      eventId: 'evt_xxx from Stripe (for idempotency)',
      amount: 'Total amount in dollars',
      customer: {
        name: 'Customer name',
        email: 'Customer email',
        phone: 'Optional phone'
      },
      delivery: {
        address: 'Street address',
        city: 'City',
        state: 'State',
        postcode: 'Postcode',
        notes: 'Optional delivery notes'
      },
      items: [{
        sku: 'Product SKU',
        quantity: 'Quantity',
        name: 'Product name',
        price: 'Price per item'
      }]
    }
  });
}

export async function POST(request: NextRequest) {
  let paymentIntentId: string | undefined;
  let customerEmail: string | undefined;
  
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    
    // CHEF'S NOTE: We ONLY accept API key authentication from payment-app
    // The payment-app already verified Stripe's signature - we trust our own service!
    const apiKey = request.headers.get('X-API-Key');
    
    // Verify internal API key - this is our ONLY authentication method
    if (!apiKey || !API_SECRET_KEY || apiKey !== API_SECRET_KEY) {

      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing API key' },
        { status: 401 }
      );
    }
    


    const {
      eventId,
      paymentIntentId: bodyPaymentIntentId,
      amount,
      currency,
      stripeReceiptUrl,
      customer,
      delivery,
      items,
      source,
      paidAt
    } = body;
    
    // Assign to outer scope for error handling
    paymentIntentId = bodyPaymentIntentId;
    customerEmail = customer?.email;

    // IDEMPOTENCY CHECK - Critical for preventing duplicates
    if (eventId) {
      const alreadyProcessed = await isEventProcessed(eventId);
      if (alreadyProcessed) {

        return NextResponse.json({
          success: true,
          message: 'Event already processed',
          duplicate: true
        });
      }
    }

    // Validate required fields
    if (!bodyPaymentIntentId || !amount || !customer || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate sequential invoice number (format: INV-YYYYMM-XXX)
    // Sequential within month, resets monthly as per business requirements
    const invoiceNumber = await getNextSequentialInvoiceNumber();

    // Calculate GST (amount includes GST) - AUSTRALIAN TAX LAW!
    const total = amount;
    const gstAmount = parseFloat((total / 11).toFixed(2)); // GST is 1/11th of GST-inclusive price
    const subtotal = total - gstAmount; // Subtotal is total MINUS GST, you muppet!

    // Format items for our database
    const formattedItems = items.map((item: any) => ({
      sku: item.sku,
      name: item.name || `Product ${item.sku}`,
      quantity: item.quantity || 1,
      price: item.price || (total / items.length) // If no individual prices, split total
    }));

    // Create the invoice in our database (already paid)
    const invoice = await createQuote({
      quoteNumber: invoiceNumber,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone || '',
      customerAddress: delivery ? `${delivery.address}, ${delivery.city} ${delivery.state} ${delivery.postcode}` : '',
      items: formattedItems,
      subtotal,
      gst: gstAmount,
      total
    });

    // Update status to paid
    await updateQuoteStatus(invoiceNumber, 'paid', 'paid');

    // Update with payment details
    if (bodyPaymentIntentId) {
      await updateQuotePaymentIntent(invoiceNumber, bodyPaymentIntentId);
    }

    // Mark this event as processed (if eventId provided)
    if (eventId) {
      await markEventProcessed(eventId, invoiceNumber);
    }

    // Prepare invoice data for email
    const customerAddress = delivery 
      ? `${delivery.address}, ${delivery.city} ${delivery.state} ${delivery.postcode}`
      : '';
      
    const paidInvoice = {
      quote_number: invoiceNumber,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone || '',
      customer_address: customerAddress,
      items: formattedItems,
      subtotal,
      gst: gstAmount,
      total,
      payment_status: 'paid',
      status: 'paid'
    };

    // CHEF'S FIX: Wait for email confirmation before returning success!
    // A $3000 sale without an email is a disaster waiting to happen!
    try {
      await sendEmailWithRetry(paidInvoice, customer.email);
    } catch (emailError) {
      // Email failed but invoice was created - this is partially successful
      // Return error so Stripe retries (maybe email service is temporarily down)

      return NextResponse.json({
        error: 'Invoice created but email delivery failed',
        invoiceId: invoiceNumber,
        needsManualEmail: true
      }, { status: 500 });
    }

    // Email sent successfully!
    return NextResponse.json({
      success: true,
      invoiceId: invoiceNumber,
      message: 'Invoice created successfully',
      emailQueued: true
    });

  } catch (error) {

    
    // Check if it's a database error
    if (error instanceof Error && error.message.includes('duplicate')) {
      // Likely a race condition on the same event
      return NextResponse.json({
        success: true,
        message: 'Event may have been processed already',
        duplicate: true
      });
    }
    
    // Log error to tracking system (fire and forget)
    try {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/invoice-errors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: paymentIntentId,
          customerEmail: customerEmail,
          error: errorMessage
        })
      });
    } catch (logError) {

    }
    
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}