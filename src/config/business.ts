// Business configuration constants
// All business-related information in one place

export const BUSINESS_INFO = {
  name: 'ausbeds',
  displayName: 'Ausbeds',
  address: '136 Victoria Rd, Marrickville NSW 2204',
  abn: '46 161 365 742',
  email: 'sales@ausbeds.com.au',
  phone: '1300 123 456',
  website: 'https://ausbeds.com.au'
};

export const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Merchant Facility', label: 'Merchant Facility (EFTPOS/Credit Card)' },
  { value: 'Stripe', label: 'Stripe (Online Payment)' }
];

export const INVOICE_DEFAULTS = {
  taxRate: 10, // GST rate in Australia
  currency: 'AUD',
  currencySymbol: '$',
  validityDays: 30
};

export const EMAIL_CONFIG = {
  fromName: process.env.EMAIL_FROM_NAME || 'Ausbeds',
  fromEmail: process.env.EMAIL_FROM || 'noreply@ausbeds.com.au',
  subject: 'Quote from Ausbeds'
};

export const APP_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://invoice-app-ausbeds.vercel.app'
};
