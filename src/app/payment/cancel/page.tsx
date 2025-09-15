'use client';

import Link from 'next/link';
import { XCircle, Home, ArrowLeft, HelpCircle } from 'lucide-react';
import Image from 'next/image';

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAFA] to-[#F5F5F5] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Cancel Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-[#FFE5F5] to-[#FFE5E5] p-8 text-center">
            <div className="bg-white rounded-full p-4 w-20 h-20 mx-auto mb-4 shadow-sm flex items-center justify-center">
              <XCircle className="w-12 h-12 text-amber-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Payment Cancelled
            </h1>
            <p className="text-gray-700">
              Your payment was not completed
            </p>
          </div>
          
          {/* Content */}
          <div className="p-8">
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-6">
                No charges have been made to your account. Your quote is still valid and you can complete your purchase at any time.
              </p>
              
              {/* Info Box */}
              <div className="bg-[#F5F5FF] rounded-xl p-4 text-left">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Why complete your order?</strong>
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Free delivery to your door</li>
                  <li>• 100 night sleep trial</li>
                  <li>• 10 year warranty</li>
                </ul>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/"
                className="w-full bg-[#E5E5FF] text-gray-900 px-6 py-3 rounded-xl hover:bg-[#D5D5FF] flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Try Payment Again
              </Link>
              
              <Link
                href="/"
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <Home className="w-5 h-5" />
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
        
        {/* Help Card */}
        <div className="bg-[#FFE5F5] rounded-2xl p-6 text-center">
          <HelpCircle className="w-8 h-8 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-700 mb-1">Having trouble with payment?</p>
          <p className="text-sm font-medium text-gray-900">
            Contact us at <a href="mailto:sales@ausbeds.com.au" className="text-[#E5E5FF] hover:underline">sales@ausbeds.com.au</a>
          </p>
          <p className="text-xs text-gray-600 mt-2">
            We accept all major credit cards, debit cards, and digital wallets
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
