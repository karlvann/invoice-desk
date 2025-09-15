import { NextRequest, NextResponse } from 'next/server';
import { getQuote, updateQuoteStatus, updateQuoteDeliveryAccess, updateQuoteCustomerDetails } from '../../../../../lib/db';

// GET - Get specific quote  
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const quote = await getQuote(id);
    
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (error: any) {
    console.error('Error fetching quote:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update quote (status or customer details)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    
    // Check if updating customer details
    if (body.customerName || body.customerEmail) {
      const quote = await updateQuoteCustomerDetails(id, {
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        customerAddress: body.customerAddress
      });
      
      if (!quote) {
        return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
      }
      
      return NextResponse.json(quote);
    }
    
    // Otherwise, update status
    const { status, paymentStatus } = body;
    const quote = await updateQuoteStatus(id, status, paymentStatus);
    
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, quote });
  } catch (error: any) {
    console.error('Error updating quote:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update quote delivery access
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { deliveryAccess } = await req.json();
    
    const quote = await updateQuoteDeliveryAccess(id, deliveryAccess);
    
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, quote });
  } catch (error: any) {
    console.error('Error updating delivery access:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
