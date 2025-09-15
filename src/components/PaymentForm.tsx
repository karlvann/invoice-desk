'use client';

import React, { useState } from 'react';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, Lock, Loader, ArrowLeft, Shield } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  invoice: any;
  onSuccess: () => void;
  onCancel: () => void;
}

function CheckoutForm({ invoice, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success?quote=${invoice.quoteNumber || invoice.quote_number || invoice.invoiceNumber}`,
      },
    });

    if (error) {
      setErrorMessage(error.message || 'An unexpected error occurred.');
    } else {
      onSuccess();
    }

    setIsLoading(false);
  };

  const hasExtraDeliveryFee = invoice.deliveryAccess === 'Stairs no help';
  const extraDeliveryFee = hasExtraDeliveryFee ? 50 : 0;
  const total = (invoice.total || invoice.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0)) + extraDeliveryFee;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#E5E5FF] to-[#FFE5F5] p-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/80 backdrop-blur rounded-xl">
            <CreditCard className="w-6 h-6 text-gray-900" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Secure Checkout</h3>
            <p className="text-sm text-gray-700">Complete your ausbeds purchase</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Order Summary */}
        <div className="bg-[#F5F5FF] rounded-xl p-6 mb-8">
          <h4 className="font-semibold text-gray-900 mb-4">Order Summary</h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Customer</span>
              <span className="text-gray-900 font-medium">{invoice.customerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Items</span>
              <span className="text-gray-900 font-medium">{invoice.items?.length || 0} item(s)</span>
            </div>
            {invoice.deliveryAccess && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery</span>
                <span className="text-gray-900 font-medium">
                  {invoice.deliveryAccess === 'Stairs no help' ? 'Extra driver needed' : invoice.deliveryAccess}
                </span>
              </div>
            )}
            {hasExtraDeliveryFee && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Extra Driver Fee</span>
                <span className="text-red-600 font-semibold">+${extraDeliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg pt-3 border-t border-gray-200">
              <span>Total (inc. GST)</span>
              <span>${total.toFixed(2)} AUD</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <PaymentElement 
              options={{
                layout: 'tabs',
                wallets: {
                  googlePay: 'auto',
                  applePay: 'auto',
                },
                defaultValues: {
                  billingDetails: {
                    name: invoice.customerName,
                    email: invoice.customerEmail,
                  }
                }
              }}
            />
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-center justify-center gap-2 mb-8 text-sm text-gray-600">
            <Shield className="w-4 h-4 text-green-600" />
            <span>Your payment information is encrypted and secure</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="submit"
              disabled={!stripe || isLoading}
              className="flex-1 bg-[#E5E5FF] text-gray-900 px-6 py-3 rounded-xl hover:bg-[#D5D5FF] font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Pay ${total.toFixed(2)}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PaymentForm({ invoice, onSuccess, onCancel }: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  React.useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        // Debug log to see what's in the invoice
        console.log('Invoice data received:', {
          customerName: invoice.customerName,
          customerEmail: invoice.customerEmail,
          hasItems: invoice.items?.length > 0,
          fullInvoice: invoice
        });

        // Validate required customer information
        if (!invoice.customerName || !invoice.customerEmail) {
          const missingFields = [];
          if (!invoice.customerName) missingFields.push('Customer Name');
          if (!invoice.customerEmail) missingFields.push('Customer Email');
          
          setError(`Missing customer information: ${missingFields.join(', ')}. Please go back and add this information to the invoice.`);
          setLoading(false);
          return;
        }

        // Calculate total with delivery fee
        const hasExtraDeliveryFee = invoice.deliveryAccess === 'Stairs no help';
        const extraDeliveryFee = hasExtraDeliveryFee ? 50 : 0;
        const total = (invoice.total || invoice.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0)) + extraDeliveryFee;

        // Prepare the payment data in the format the payment server expects
        const paymentData = {
          amount: total,
          currency: 'aud',
          items: invoice.items.map((item: any) => ({
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          customer: {
            name: invoice.customerName,
            email: invoice.customerEmail,
            phone: invoice.customerPhone || ''
          },
          delivery: {
            address: invoice.customerAddress ? String(invoice.customerAddress).split('\n')[0] || '' : '',
            city: 'Sydney',
            state: 'NSW',
            postcode: '2000',
            notes: invoice.deliveryAccess || ''
          },
          source: 'invoice-app'
        };

        // Log the data being sent for debugging
        console.log('Sending payment data:', JSON.stringify(paymentData, null, 2));
        console.log('Invoice data:', JSON.stringify(invoice, null, 2));

        // Call our secure API endpoint (which will call the payment server)
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData),
        });

        const data = await response.json();
        
        if (data.error) {
          console.error('Payment server error:', data.error);
          setError(data.error);
        } else if (!response.ok) {
          console.error('Payment server returned non-OK status:', response.status, data);
          setError('Payment server error - please check console for details');
        } else {
          setClientSecret(data.clientSecret);
        }
      } catch (err) {
        setError('Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [invoice]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-12 max-w-md mx-auto text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E5E5FF] mx-auto mb-4"></div>
        <p className="text-gray-600">Preparing secure payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md mx-auto text-center">
        <div className="text-red-600 text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Error</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md mx-auto text-center">
        <p className="text-gray-600 mb-6">Unable to initialize payment</p>
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#10b981',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        spacingUnit: '4px',
        borderRadius: '12px',
        fontSizeBase: '15px',
      },
      rules: {
        '.Tab': {
          border: '2px solid #e5e7eb',
          boxShadow: 'none',
        },
        '.Tab:hover': {
          border: '2px solid #10b981',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        },
        '.Tab--selected': {
          border: '2px solid #10b981',
          backgroundColor: '#dcfce7',
          boxShadow: '0 2px 4px 0 rgba(16, 185, 129, 0.3)',
          color: '#064e3b',
          fontWeight: '600',
        },
        '.Tab--selected:hover': {
          border: '2px solid #059669',
          backgroundColor: '#bbf7d0',
          boxShadow: '0 2px 4px 0 rgba(16, 185, 129, 0.4)',
        },
        '.TabIcon--selected': {
          fill: '#064e3b',
        },
        '.Input': {
          border: '2px solid #e5e7eb',
          boxShadow: 'none',
        },
        '.Input:focus': {
          border: '2px solid #10b981',
          boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)',
        },
        '.Label': {
          fontWeight: '500',
          color: '#374151',
        },
      },
    },
  };

  return (
    <Elements options={options} stripe={stripePromise}>
      <CheckoutForm
        invoice={invoice}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}
