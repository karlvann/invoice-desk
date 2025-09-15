import React from 'react';
import { CheckCircle, X, CreditCard } from 'lucide-react';
import { PAYMENT_METHODS } from '../config/business';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPaymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  onConfirm: () => void;
  customerName: string;
  total: number;
  invoiceNumber: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  selectedPaymentMethod,
  onPaymentMethodChange,
  onConfirm,
  customerName,
  total,
  invoiceNumber
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E5FFE5] to-[#E5E5FF] p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Mark Invoice as Paid
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => onPaymentMethodChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5E5FF] focus:border-transparent transition-all appearance-none bg-white"
              >
                <option value="">Select payment method...</option>
                {PAYMENT_METHODS.filter(method => method.value !== 'Stripe').map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="bg-[#F5F5FF] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" />
                <div className="w-full">
                  <p className="font-medium text-gray-900 mb-3">Invoice Details</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer:</span>
                      <span className="text-gray-900 font-medium">{customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice #:</span>
                      <span className="text-gray-900 font-medium">{invoiceNumber || 'Will be generated'}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-900 font-semibold">Total:</span>
                      <span className="text-gray-900 font-semibold">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> This action will mark the invoice as paid and cannot be undone. Make sure you have received the payment before confirming.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!selectedPaymentMethod}
              className="flex-1 bg-[#E5E5FF] text-gray-900 px-6 py-3 rounded-xl hover:bg-[#D5D5FF] disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Confirm Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
