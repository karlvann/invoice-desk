'use client';

import React from 'react';
import { CheckCircle, AlertCircle, DollarSign, XCircle, ExternalLink } from 'lucide-react';
import { getPaymentStatus, getPaymentStatusDisplay, isPending } from '@/utils/paymentStatus';
import Link from 'next/link';

interface PaymentStatusBadgeProps {
  invoice: any;
  showPayLink?: boolean;
  size?: 'small' | 'medium' | 'large';
  showAmount?: boolean;
  className?: string;
}

/**
 * SINGLE UNIFIED COMPONENT for displaying payment status
 * Use this everywhere - don't create separate status displays
 */
export default function PaymentStatusBadge({ 
  invoice, 
  showPayLink = true,
  size = 'medium',
  showAmount = true,
  className = ''
}: PaymentStatusBadgeProps) {
  const statusInfo = getPaymentStatusDisplay(invoice);
  const isUnpaid = isPending(invoice);
  const quoteId = invoice.id || invoice.quote_number;
  
  // Size classes
  const sizeClasses = {
    small: 'text-xs px-2 py-0.5',
    medium: 'text-xs px-2.5 py-1',
    large: 'text-sm px-3 py-1.5'
  };
  
  const iconSizes = {
    small: 'w-3 h-3',
    medium: 'w-3 h-3',
    large: 'w-4 h-4'
  };
  
  // Get the right icon component
  const IconComponent = 
    statusInfo.icon === 'CheckCircle' ? CheckCircle :
    statusInfo.icon === 'DollarSign' ? DollarSign :
    statusInfo.icon === 'XCircle' ? XCircle :
    AlertCircle;
  
  // Build the label
  const label = statusInfo.status === 'partial' && showAmount && invoice.paid_amount
    ? `$${parseFloat(invoice.paid_amount).toFixed(0)} paid`
    : statusInfo.label;
  
  const badge = (
    <span 
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${statusInfo.bgColor} ${statusInfo.color} ${className}`}
    >
      <IconComponent className={iconSizes[size]} />
      <span>{label}</span>
    </span>
  );
  
  // If unpaid and we have a quote ID, show payment link
  if (isUnpaid && showPayLink && quoteId) {
    return (
      <div className="flex items-center gap-2">
        {badge}
        <Link 
          href={`/checkout/${quoteId}`}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
          title="Complete payment"
        >
          <span>Pay now</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    );
  }
  
  return badge;
}

/**
 * Simplified version for just the status text (no badge styling)
 */
export function PaymentStatusText({ invoice }: { invoice: any }) {
  const statusInfo = getPaymentStatusDisplay(invoice);
  return <span className={statusInfo.color}>{statusInfo.label}</span>;
}

/**
 * Payment link button for unpaid invoices
 */
export function PaymentLinkButton({ invoice, className = '' }: { invoice: any; className?: string }) {
  const isUnpaid = isPending(invoice);
  const quoteId = invoice.id || invoice.quote_number;
  
  if (!isUnpaid || !quoteId) {
    return null;
  }
  
  return (
    <Link 
      href={`/checkout/${quoteId}`}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${className}`}
    >
      <DollarSign className="w-4 h-4" />
      <span>Complete Payment</span>
    </Link>
  );
}

/**
 * Inline payment status for tables
 */
export function PaymentStatusCell({ invoice }: { invoice: any }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <PaymentStatusBadge 
        invoice={invoice} 
        showPayLink={false} 
        size="small"
      />
      {isPending(invoice) && invoice.quote_number && (
        <Link 
          href={`/checkout/${invoice.quote_number}`}
          className="text-xs text-blue-600 hover:underline"
        >
          Pay →
        </Link>
      )}
    </div>
  );
}