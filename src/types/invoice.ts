export interface LineItem {
  sku: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id?: number;
  invoiceNumber: string;
  quote_number?: string;
  date: string;
  created_at?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  deliveryAccess: string;
  deliveryDate?: string;
  deliveryDateOption?: 'specific' | 'callLater';
  needsBase?: boolean;
  floorType?: string;
  items: LineItem[];
  notes: string;
  taxRate: number;
  status: 'quote' | 'paid' | 'cancelled';
  payment_status?: 'unpaid' | 'partial' | 'paid';
  paymentStatus?: string; // Keep for backwards compatibility
  paid_amount?: number | string;
  payment_note?: string;
  paymentMethod?: string;
  paidAt?: string;
  total: number | string;
  subtotal: number | string;
  gst: number | string;
}

export interface Product {
  sku: string;
  name: string;
  price: number;
  range: string;
  size: string;
  firmness: string;
  model?: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
}
