import { NextRequest, NextResponse } from 'next/server';
import { createQuote, getAllQuotes, getTotalQuotesCount, createOrUpdateCustomer } from '../../../../lib/db';
import { getNextSequentialInvoiceNumber } from '../../../utils/invoice-sequential';

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
      quoteData.quoteNumber = await getNextSequentialInvoiceNumber();
    }

    // Validate required fields
    if (!quoteData.customerEmail) {
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
    }

    // Create or update customer
    await createOrUpdateCustomer({
      name: quoteData.customerName,
      email: quoteData.customerEmail,
      phone: quoteData.customerPhone,
      address: quoteData.customerAddress,
    });

    // Create quote
    const quote = await createQuote(quoteData);

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

// GET - Get all quotes with PAGINATION (Gordon's performance fix!)
export async function GET(req: NextRequest) {
  try {
    // Parse pagination params from query string
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
    // Fetch paginated quotes and total count
    const [quotes, totalCount] = await Promise.all([
      getAllQuotes(limit, offset),
      getTotalQuotesCount()
    ]);
    
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
