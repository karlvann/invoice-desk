'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams } from 'next/navigation';
import CheckoutTemplate from '@/components/CheckoutTemplate';

interface QuoteItem {
  id?: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  sku?: string;
}

interface QuoteData {
  id: string;
  quote_number: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  delivery_suburb?: string;
  delivery_state?: string;
  delivery_postcode?: string;
  delivery_access?: string;
  items: QuoteItem[];
  subtotal: number;
  gst: number;
  total: number;
  status: string;
  payment_status?: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection and try again');
    }
    throw error;
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  retryDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetchWithTimeout(url, options);
      if (!response.ok && response.status >= 500 && i < maxRetries) {
        // Server error, retry
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, i)));
        continue;
      }
      return response;
    } catch (error: any) {
      lastError = error;
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, i)));
        continue;
      }
    }
  }
  
  throw lastError || new Error('Failed to fetch after retries');
}

function convertQuoteData(data: any): QuoteData {
  return {
    ...data,
    subtotal: parseFloat(data.subtotal || 0),
    gst: parseFloat(data.gst || 0),
    total: parseFloat(data.total || 0),
    items: data.items?.map((item: any) => ({
      ...item,
      price: parseFloat(item.price || 0),
      quantity: parseInt(item.quantity || 1)
    })) || []
  };
}

function CheckoutPageContent() {
  const params = useParams();
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);

  const fetchQuote = useCallback(async () => {
    try {
      setRetrying(false);
      const response = await fetchWithRetry(`/api/quotes/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Quote not found - please check your link');
        } else if (response.status >= 500) {
          throw new Error('Server error - our team has been notified');
        } else {
          throw new Error(`Unable to load quote (Error ${response.status})`);
        }
      }
      
      const data = await response.json();
      // Convert string decimal values to numbers (database returns them as strings)
      setQuoteData(convertQuoteData(data));
      setError('');
    } catch (err: any) {
      if (err.message.includes('timeout')) {
        setError('Connection timeout - please check your internet connection');
      } else if (err.message.includes('fetch')) {
        setError('Network error - please check your internet connection');
      } else {
        setError(err.message || 'Unable to load quote. Please try again.');
      }
      setRetrying(true);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const handleUpdateCustomer = async (details: any) => {
    try {
      const response = await fetchWithTimeout(`/api/quotes/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(details)
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Quote not found');
        } else if (response.status >= 500) {
          throw new Error('Server error - please try again');
        } else {
          throw new Error('Failed to update customer details');
        }
      }

      const updatedQuote = await response.json();
      // Convert the response data to ensure numbers are properly typed
      const convertedData = convertQuoteData(updatedQuote);
      setQuoteData(convertedData);
      return convertedData;
    } catch (error: any) {
      if (error.message.includes('timeout')) {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError('');
    fetchQuote();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading checkout...</p>
          {retrying && (
            <p className="text-sm text-gray-500 mt-2">Retrying connection...</p>
          )}
        </div>
      </div>
    );
  }

  if (error || !quoteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-zinc-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Checkout</h1>
          <p className="text-gray-600 mb-6">{error || 'Quote not found'}</p>
          <div className="space-y-3">
            <button 
              onClick={handleRetry}
              className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Try Again
            </button>
            <a 
              href="https://ausbeds.com.au" 
              className="block text-emerald-600 hover:underline"
            >
              Return to ausbeds website
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Check if quote is already paid
  if (quoteData.payment_status === 'paid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-zinc-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Already Paid</h1>
          <p className="text-gray-600 mb-6">This invoice has already been paid.</p>
          <p className="text-sm text-gray-500 mb-4">Quote #{quoteData.quote_number}</p>
          <a 
            href="https://ausbeds.com.au" 
            className="text-emerald-600 hover:underline"
          >
            Return to ausbeds website
          </a>
        </div>
      </div>
    );
  }

  // Use the beautiful CheckoutTemplate with full functionality
  return (
    <CheckoutTemplate 
      initialQuote={quoteData} 
      onUpdateCustomer={handleUpdateCustomer}
    />
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutPageContent />
    </Suspense>
  );
}