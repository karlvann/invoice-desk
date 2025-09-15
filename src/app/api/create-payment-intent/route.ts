import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get server-side environment variables
    const paymentServerUrl = process.env.PAYMENT_SERVER_URL || process.env.NEXT_PUBLIC_PAYMENT_SERVER_URL || 'https://make-payments.vercel.app';
    const apiKey = process.env.API_SECRET_KEY;

    if (!apiKey) {
      console.error('API_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500 }
      );
    }

    // Forward the request to the payment server with authentication
    const response = await fetch(`${paymentServerUrl}/api/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Payment server error:', data);
      return NextResponse.json(
        { error: data.error || 'Payment server error' },
        { status: response.status }
      );
    }

    // Return the response from payment server
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
