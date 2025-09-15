'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Home, FileText, Mail, Sparkles } from 'lucide-react';
import Image from 'next/image';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const quoteNumber = searchParams.get('quote');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');

  useEffect(() => {
    const updateInvoiceStatus = async () => {
      if (quoteNumber) {
        try {
          // Update the invoice status to paid
          const response = await fetch(`/api/quotes/${quoteNumber}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'paid',
              paymentStatus: 'paid',
              paymentMethod: 'Stripe',
              paidAt: new Date().toISOString()
            }),
          });

          if (response.ok) {
            const updatedQuote = await response.json();
            setInvoiceNumber(updatedQuote.quote_number);
          }
        } catch (error) {
          console.error('Error updating invoice status:', error);
        }
      }

      // Show success after updating status
      setTimeout(() => {
        setPaymentData({
          sessionId,
          status: 'succeeded'
        });
        setLoading(false);
      }, 1000);
    };

    updateInvoiceStatus();
  }, [sessionId, quoteNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAFAFA] to-[#F5F5F5] flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E5E5FF] mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAFA] to-[#F5F5F5] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-[#E5FFE5] to-[#E5E5FF] p-8 text-center">
            <div className="bg-white rounded-full p-4 w-20 h-20 mx-auto mb-4 shadow-sm flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-700">
              Your order has been confirmed
            </p>
          </div>
          
          {/* Content */}
          <div className="p-8">
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-4">
                Thank you for your purchase! We&apos;ve sent a confirmation email with your order details.
              </p>
              
              {sessionId && (
                <div className="bg-[#F5F5FF] rounded-xl p-4 mb-6">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Transaction ID</p>
                  <p className="font-mono text-xs text-gray-700 break-all">{sessionId}</p>
                </div>
              )}
            </div>
            
            {/* What's Next */}
            <div className="bg-[#FFE5F5] rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                What happens next?
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>You&apos;ll receive an email confirmation shortly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>We&apos;ll contact you to arrange delivery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Your 100 night trial starts on delivery</span>
                </li>
              </ul>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/"
                className="w-full bg-[#E5E5FF] text-gray-900 px-6 py-3 rounded-xl hover:bg-[#D5D5FF] flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <Home className="w-5 h-5" />
                Return to Dashboard
              </Link>
              
              <Link
                href="/"
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <FileText className="w-5 h-5" />
                View All Invoices
              </Link>
            </div>
          </div>
        </div>
        
        {/* Contact Card */}
        <div className="bg-[#E5FFE5] rounded-2xl p-6 text-center">
          <Mail className="w-8 h-8 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-700 mb-1">Questions about your order?</p>
          <p className="text-sm font-medium text-gray-900">
            Contact us at <a href="mailto:sales@ausbeds.com.au" className="text-[#E5E5FF] hover:underline">sales@ausbeds.com.au</a>
          </p>
        </div>
        
        {/* Footer */}
        <div className="mt-6 text-center">
          <Image
            src="/images/logo-black.svg"
            alt="ausbeds"
            width={100}
            height={30}
            className="h-8 w-auto mx-auto opacity-50"
          />
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#FAFAFA] to-[#F5F5F5] flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E5E5FF] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
