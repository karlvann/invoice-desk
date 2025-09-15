export const VIEW_TYPES = {
  INVOICES: 'invoices',
  PAID_INVOICES: 'paid-invoices',
  NEW_INVOICE: 'new-invoice',
  PRODUCTS: 'products',
  PAYMENT: 'payment',
  PREVIEW: 'preview',
  INVOICE_WIZARD: 'invoice-wizard',
  LAYER_GUIDE: 'layer-guide',
  EMAIL_TEMPLATES: 'email-templates',
  CHECKOUT_TEMPLATE: 'checkout-template',
} as const;

export const PAYMENT_METHODS = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank',
  EFTPOS: 'eftpos',
  STRIPE: 'stripe',
} as const;

export const INVOICE_STATUS = {
  QUOTE: 'quote',
  PAID: 'paid',
  CANCELLED: 'cancelled',
} as const;

export const DELIVERY_ACCESS_OPTIONS = [
  { value: '', label: 'Select delivery access...' },
  { value: 'Ground floor', label: 'Ground floor' },
  { value: 'Lift access', label: 'Lift access' },
  { value: 'Few steps', label: 'Few steps' },
  { value: '1 flight of stairs', label: '1 flight of stairs' },
  { value: '2 flights of stairs', label: '2 flights of stairs' },
  { value: '3 flights of stairs', label: '3 flights of stairs' },
  { value: '4+ flights of stairs', label: '4+ flights of stairs' },
  { value: 'Stairs no help', label: 'Stairs no help (+$50)' },
] as const;

export const UI_COLORS = {
  PRIMARY: '#E5E5FF',
  PRIMARY_HOVER: '#D5D5FF',
  SECONDARY: '#FFE5F5',
  SECONDARY_HOVER: '#FFD5F5',
  SUCCESS: '#E5FFE5',
  SUCCESS_HOVER: '#D5FFD5',
  DANGER: '#FFE5E5',
  DANGER_HOVER: '#FFD5E5',
} as const;

export const SIDEBAR_WIDTH = {
  OPEN: 'w-64',
  CLOSED: 'w-20',
} as const;

export const DEFAULT_ITEMS_PER_PAGE = 5;
export const GST_RATE = 10;
