import { NextRequest, NextResponse } from 'next/server';
import { softDeleteQuotes } from '../../../../../lib/db';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { quoteNumbers } = body;

    // Validate input
    if (!Array.isArray(quoteNumbers) || quoteNumbers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid quote numbers provided' },
        { status: 400 }
      );
    }

    // Perform soft delete
    const deletedQuotes = await softDeleteQuotes(quoteNumbers);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedQuotes.length} invoice(s)`,
      deletedCount: deletedQuotes.length,
      deletedQuotes: deletedQuotes.map((q: any) => ({
        quote_number: q.quote_number,
        customer_name: q.customer_name
      }))
    });

  } catch (error) {
    console.error('Error deleting quotes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete quotes' },
      { status: 500 }
    );
  }
}
