/**
 * Single Source of Truth for Payment Status
 * 
 * ALWAYS use payment_status field, NOT status field
 * This resolves the confusion between two competing fields
 */

export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'failed';

export interface PaymentStatusInfo {
  status: PaymentStatus;
  label: string;
  color: string;
  bgColor: string;
  icon?: string;
}

/**
 * Get normalized payment status from an invoice/quote object
 * This is the SINGLE SOURCE OF TRUTH for payment status
 */
export function getPaymentStatus(invoice: any): PaymentStatus {
  // ALWAYS use payment_status field, fallback to 'pending' if not set
  const status = invoice?.payment_status || 'pending';
  
  // Normalize old 'unpaid' values to 'pending'
  if (status === 'unpaid' || status === 'quote' || status === 'draft') {
    return 'pending';
  }
  
  // Ensure it's a valid payment status
  if (['paid', 'partial', 'failed', 'pending'].includes(status)) {
    return status as PaymentStatus;
  }
  
  return 'pending';
}

/**
 * Check if an invoice is paid
 */
export function isPaid(invoice: any): boolean {
  return getPaymentStatus(invoice) === 'paid';
}

/**
 * Check if payment is pending
 */
export function isPending(invoice: any): boolean {
  return getPaymentStatus(invoice) === 'pending';
}

/**
 * Get display information for a payment status
 */
export function getPaymentStatusDisplay(invoice: any): PaymentStatusInfo {
  const status = getPaymentStatus(invoice);
  
  switch (status) {
    case 'paid':
      return {
        status: 'paid',
        label: 'Paid',
        color: 'text-green-800',
        bgColor: 'bg-green-100',
        icon: 'CheckCircle'
      };
    case 'partial':
      return {
        status: 'partial',
        label: `$${invoice.paid_amount || 0} paid`,
        color: 'text-amber-800',
        bgColor: 'bg-amber-100',
        icon: 'DollarSign'
      };
    case 'failed':
      return {
        status: 'failed',
        label: 'Failed',
        color: 'text-red-800',
        bgColor: 'bg-red-100',
        icon: 'XCircle'
      };
    case 'pending':
    default:
      return {
        status: 'pending',
        label: 'Unpaid',
        color: 'text-red-800',
        bgColor: 'bg-red-100',
        icon: 'AlertCircle'
      };
  }
}

/**
 * Update payment status in database
 * This should be the ONLY way to update payment status
 */
export async function updatePaymentStatus(
  quoteNumber: string, 
  newStatus: PaymentStatus,
  paidAmount?: number
): Promise<void> {
  const response = await fetch(`/api/quotes/${quoteNumber}/update-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payment_status: newStatus,
      paid_amount: paidAmount
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to update payment status');
  }
}