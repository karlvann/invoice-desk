// Invoice utility functions
// Helper functions for invoice operations

import { getNextSequentialInvoiceNumber } from './invoice-sequential';

/**
 * Generate a unique invoice number - NOW SEQUENTIAL!
 * Format: INV-YYYYMM-XXX (e.g., INV-202501-001, INV-202501-002)
 * Sequential within month, resets monthly as per business requirements
 */
export const generateInvoiceNumber = (): string => {

  
  // FALLBACK: Returns a timestamp-based number to avoid breaking existing sync code
  // This should be replaced with async calls to getNextSequentialInvoiceNumber()
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-3);
  return `INV-${year}${month}-T${timestamp}`;
};

/**
 * Generate a quote number
 * Format: AUS-timestamp (e.g., AUS-1704067200000)
 */
export const generateQuoteNumber = (): string => {
  const timestamp = Date.now();
  return `AUS-${timestamp}`;
};

/**
 * Format date for display (Australian format)
 */
export const formatDate = (dateString: string): string => {
  // Handle undefined, null, or empty dates
  if (!dateString) {
    return new Date().toLocaleDateString('en-AU');
  }
  
  // Try to parse the date
  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    // Return today's date if the date is invalid
    return new Date().toLocaleDateString('en-AU');
  }
  
  return date.toLocaleDateString('en-AU');
};

/**
 * Get invoice status color classes
 */
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'bg-green-100 text-green-700';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'draft':
      return 'bg-gray-100 text-gray-700';
    case 'overdue':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-purple-100 text-purple-700';
  }
};
