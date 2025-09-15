import { NextRequest, NextResponse } from 'next/server';
import { createInvoice, getAllInvoices, generateInvoiceNumber } from '../../../../lib/json-storage';
import type { Invoice } from '../../../../lib/json-storage';

// POST - Create new quote (no auth required for creating quotes)
export async function POST(req: NextRequest) {
  try {
    const rawData = await req.json();

    // Map frontend field names to database field names
    const quoteData = {
      quoteNumber: rawData.quoteNumber || rawData.invoiceNumber,
      customerName: rawData.customerName,
      customerEmail: rawData.customerEmail,
      customerPhone: rawData.customerPhone,
      customerAddress: rawData.customerAddress,
      items: rawData.items || [],
      subtotal: rawData.subtotal || 0,
      gst: rawData.gst || 0,
      total: rawData.total || 0,
      deliveryAccess: rawData.deliveryAccess,
      notes: rawData.notes
    };
    
    // Store additional fields in notes if they exist
    const additionalInfo = [];
    if (rawData.deliveryDate) {
      additionalInfo.push(`Delivery Date: ${rawData.deliveryDate}`);
    }
    if (rawData.deliveryDateOption) {
      additionalInfo.push(`Delivery Option: ${rawData.deliveryDateOption}`);
    }
    if (rawData.needsBase !== undefined) {
      additionalInfo.push(`Needs Base: ${rawData.needsBase ? 'Yes' : 'No'}`);
    }
    if (rawData.floorType) {
      additionalInfo.push(`Floor Type: ${rawData.floorType}`);
    }
    
    // Append additional info to notes if it exists
    if (additionalInfo.length > 0 && quoteData.notes) {
      quoteData.notes = `${quoteData.notes}\n\n${additionalInfo.join('\n')}`;
    } else if (additionalInfo.length > 0) {
      quoteData.notes = additionalInfo.join('\n');
    }

    // Generate quote number if not provided using proper INV-YYYYMM-XXX format
    if (!quoteData.quoteNumber) {
      quoteData.quoteNumber = generateInvoiceNumber();
    }

    // Validate required fields
    if (!quoteData.customerEmail) {
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
    }

    // Create quote using JSON storage
    const invoiceData: Omit<Invoice, 'id' | 'created_at' | 'updated_at'> = {
      quote_number: quoteData.quoteNumber,
      customer_name: quoteData.customerName,
      customer_email: quoteData.customerEmail,
      customer_phone: quoteData.customerPhone,
      customer_address: quoteData.customerAddress,
      items: quoteData.items,
      subtotal: quoteData.subtotal,
      gst: quoteData.gst,
      total: quoteData.total,
      status: 'draft',
      payment_status: 'pending',
      delivery_access: quoteData.deliveryAccess,
      notes: quoteData.notes
    };

    const quote = createInvoice(invoiceData);

    return NextResponse.json({ success: true, quote });
  } catch (error: any) {
    console.error('Error creating quote:', error);
    const errorMessage = error.message || 'Failed to create quote';
    return NextResponse.json({ 
      error: errorMessage,
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    }, { status: 500 });
  }
}

// GET - Get all quotes with PAGINATION
export async function GET(req: NextRequest) {
  try {
    // Parse pagination params from query string
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
    // Fetch paginated quotes from JSON storage
    const quotes = getAllInvoices(limit, offset);
    
    // For pagination, we need total count - let's get all and count
    const allQuotes = getAllInvoices(1000, 0); // Get reasonable max for prototype
    const totalCount = allQuotes.length;
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    
    return NextResponse.json({ 
      quotes,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error: any) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }
}
