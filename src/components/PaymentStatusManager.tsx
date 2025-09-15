'use client';

import { useState } from 'react';
import { DollarSign, Check, AlertCircle, X, CreditCard, Store, Building, Banknote } from 'lucide-react';

interface PaymentStatusManagerProps {
  quote: any;
  onClose: () => void;
  onUpdate: () => void;
}

export default function PaymentStatusManager({ quote, onClose, onUpdate }: PaymentStatusManagerProps) {
  const [paymentStatus, setPaymentStatus] = useState(quote.payment_status || 'unpaid');
  const [amountPaid, setAmountPaid] = useState(quote.paid_amount || 0);
  const [paymentNote, setPaymentNote] = useState(quote.payment_note || '');
  const [paymentMethod, setPaymentMethod] = useState('in-store');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const total = parseFloat(quote.total || 0);
  const currentPaid = parseFloat(quote.paid_amount || 0);
  const remaining = total - currentPaid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate amount for partial payment
      if (paymentStatus === 'partial') {
        const paid = parseFloat(amountPaid);
        if (paid <= 0 || paid >= total) {
          setError('Partial payment must be between $0 and the total amount');
          setIsSubmitting(false);
          return;
        }
      }

      const response = await fetch(`/api/quotes/${quote.id || quote.quote_number}/update-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentStatus,
          amountPaid: paymentStatus === 'paid' ? total : paymentStatus === 'unpaid' ? 0 : amountPaid,
          paymentNote,
          paymentMethod: paymentStatus === 'paid' ? paymentMethod : null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update payment status');
      }

      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'partial':
        return 'text-amber-600 bg-amber-50';
      case 'unpaid':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Update Payment Status</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Current Status Display */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Invoice #{quote.quote_number}</div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Total Amount:</span>
              <span className="font-bold text-lg">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Currently Paid:</span>
              <span className="font-semibold">${currentPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Remaining:</span>
              <span className={`font-semibold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${remaining.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Status Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentStatus('unpaid');
                  setAmountPaid(0);
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  paymentStatus === 'unpaid'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <AlertCircle className={`w-5 h-5 mx-auto mb-1 ${
                  paymentStatus === 'unpaid' ? 'text-red-600' : 'text-gray-400'
                }`} />
                <div className={`text-xs font-medium ${
                  paymentStatus === 'unpaid' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  Unpaid
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentStatus('partial')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  paymentStatus === 'partial'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <DollarSign className={`w-5 h-5 mx-auto mb-1 ${
                  paymentStatus === 'partial' ? 'text-amber-600' : 'text-gray-400'
                }`} />
                <div className={`text-xs font-medium ${
                  paymentStatus === 'partial' ? 'text-amber-600' : 'text-gray-600'
                }`}>
                  Partial
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentStatus('paid');
                  setAmountPaid(total);
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  paymentStatus === 'paid'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Check className={`w-5 h-5 mx-auto mb-1 ${
                  paymentStatus === 'paid' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <div className={`text-xs font-medium ${
                  paymentStatus === 'paid' ? 'text-green-600' : 'text-gray-600'
                }`}>
                  Paid
                </div>
              </button>
            </div>
          </div>

          {/* Payment Method Selection for Paid Status */}
          {paymentStatus === 'paid' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('in-store')}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center ${
                    paymentMethod === 'in-store'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Store className={`w-5 h-5 mb-1 ${
                    paymentMethod === 'in-store' ? 'text-emerald-600' : 'text-gray-400'
                  }`} />
                  <div className={`text-xs font-medium ${
                    paymentMethod === 'in-store' ? 'text-emerald-600' : 'text-gray-600'
                  }`}>
                    In-Store
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center ${
                    paymentMethod === 'stripe'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className={`w-5 h-5 mb-1 ${
                    paymentMethod === 'stripe' ? 'text-emerald-600' : 'text-gray-400'
                  }`} />
                  <div className={`text-xs font-medium ${
                    paymentMethod === 'stripe' ? 'text-emerald-600' : 'text-gray-600'
                  }`}>
                    Stripe API
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank-transfer')}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center ${
                    paymentMethod === 'bank-transfer'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Building className={`w-5 h-5 mb-1 ${
                    paymentMethod === 'bank-transfer' ? 'text-emerald-600' : 'text-gray-400'
                  }`} />
                  <div className={`text-xs font-medium ${
                    paymentMethod === 'bank-transfer' ? 'text-emerald-600' : 'text-gray-600'
                  }`}>
                    Bank Transfer
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center ${
                    paymentMethod === 'cash'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Banknote className={`w-5 h-5 mb-1 ${
                    paymentMethod === 'cash' ? 'text-emerald-600' : 'text-gray-400'
                  }`} />
                  <div className={`text-xs font-medium ${
                    paymentMethod === 'cash' ? 'text-emerald-600' : 'text-gray-600'
                  }`}>
                    Cash
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Amount Input for Partial Payment */}
          {paymentStatus === 'partial' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Paid
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={total - 0.01}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required={paymentStatus === 'partial'}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter the amount that has been paid (must be less than ${total.toFixed(2)})
              </p>
            </div>
          )}

          {/* Payment Note */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Note (Optional)
            </label>
            <textarea
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              rows={3}
              placeholder="e.g., Bank transfer received, Check #1234, Cash payment..."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}