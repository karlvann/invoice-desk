import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const { paymentStatus, amountPaid, paymentNote, paymentMethod } = await request.json();
    
    // Validate payment status
    const validStatuses = ['unpaid', 'partial', 'paid'];
    if (!validStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: 'Invalid payment status. Must be: unpaid, partial, or paid' },
        { status: 400 }
      );
    }

    // First get the current quote to check the total
    const { rows: quotes } = await sql`
      SELECT * FROM quotes 
      WHERE (quote_number = ${id} OR id = ${id}::int)
      AND deleted_at IS NULL
    `;

    if (quotes.length === 0) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    const quote = quotes[0];
    const total = parseFloat(quote.total);
    const paidAmount = parseFloat(amountPaid || 0);

    // Validate payment amount for partial payments
    if (paymentStatus === 'partial') {
      if (paidAmount <= 0 || paidAmount >= total) {
        return NextResponse.json(
          { error: 'Partial payment amount must be greater than 0 and less than total' },
          { status: 400 }
        );
      }
    }

    // Update the quote with new payment status and amount
    const { rows } = await sql`
      UPDATE quotes 
      SET payment_status = ${paymentStatus},
          paid_amount = ${paymentStatus === 'paid' ? total : paidAmount},
          payment_note = ${paymentNote || null},
          payment_method = ${paymentStatus === 'paid' ? (paymentMethod || 'in-store') : null},
          updated_at = CURRENT_TIMESTAMP
      WHERE (quote_number = ${id} OR id = ${id}::int)
      AND deleted_at IS NULL
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update payment status' },
        { status: 500 }
      );
    }

    // Log payment change in payments table if amount changed
    if (paidAmount > 0 || paymentStatus === 'paid') {
      await sql`
        INSERT INTO payments (
          quote_id,
          stripe_payment_intent_id,
          amount,
          status,
          payment_method,
          created_at
        ) VALUES (
          ${quote.id},
          ${`manual_${Date.now()}`},
          ${paymentStatus === 'paid' ? total : paidAmount},
          ${paymentStatus},
          ${paymentMethod || 'in-store'},
          CURRENT_TIMESTAMP
        )
      `;
    }

    return NextResponse.json({
      success: true,
      quote: rows[0],
      message: `Payment status updated to ${paymentStatus}`
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    // Get payment history for this quote
    const { rows } = await sql`
      SELECT 
        q.quote_number,
        q.total,
        q.payment_status,
        q.paid_amount,
        p.amount as payment_amount,
        p.created_at as payment_date,
        p.payment_method,
        p.status as payment_transaction_status
      FROM quotes q
      LEFT JOIN payments p ON q.id = p.quote_id
      WHERE (q.quote_number = ${id} OR q.id = ${id}::int)
      AND q.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    const quote = rows[0];
    const payments = rows.filter(r => r.payment_amount).map(r => ({
      amount: r.payment_amount,
      date: r.payment_date,
      method: r.payment_method,
      status: r.payment_transaction_status
    }));

    return NextResponse.json({
      quote_number: quote.quote_number,
      total: quote.total,
      payment_status: quote.payment_status,
      paid_amount: quote.paid_amount || 0,
      remaining: parseFloat(quote.total) - parseFloat(quote.paid_amount || 0),
      payments
    });

  } catch (error) {
    console.error('Error getting payment info:', error);
    return NextResponse.json(
      { error: 'Failed to get payment information' },
      { status: 500 }
    );
  }
}