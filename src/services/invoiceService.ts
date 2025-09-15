import { Invoice } from '../types/invoice';
import { getNextSequentialInvoiceNumber } from '../utils/invoice-sequential';
import { 
  calculateSubtotal, 
  calculateTotal, 
  calculateGSTComponent 
} from '../utils/calculations';

export const invoiceService = {
  async fetchAll(): Promise<Invoice[]> {
    const response = await fetch('/api/quotes');
    
    if (!response.ok) {
      throw new Error('Failed to fetch invoices');
    }
    
    const data = await response.json();
    return this.mapQuotesToInvoices(data.quotes || []);
  },

  async create(invoice: Invoice): Promise<any> {
    // Generate sequential invoice number if not provided
    const invoiceNumber = invoice.invoiceNumber || await getNextSequentialInvoiceNumber();
    
    const invoiceData = {
      ...invoice,
      invoiceNumber: invoiceNumber,
      subtotal: calculateSubtotal(invoice.items),
      gst: calculateGSTComponent(calculateTotal(invoice.items)),
      total: calculateTotal(invoice.items)
    };

    const response = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
    });

    if (!response.ok) {
      throw new Error('Failed to save invoice');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to save invoice');
    }

    return result;
  },

  async updateStatus(
    quoteNumber: string, 
    status: string, 
    paymentStatus?: string
  ): Promise<void> {
    const response = await fetch(`/api/quotes/${quoteNumber}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, paymentStatus }),
    });

    if (!response.ok) {
      throw new Error('Failed to update invoice status');
    }
  },

  async bulkDelete(quoteNumbers: string[]): Promise<any> {
    const response = await fetch('/api/quotes/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteNumbers })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete invoices');
    }

    return result;
  },

  mapQuotesToInvoices(quotes: any[]): Invoice[] {
    return quotes.map((quote: any) => ({
      ...quote,
      id: quote.id,
      invoiceNumber: quote.quote_number,
      date: quote.created_at,
      customerName: quote.customer_name,
      customerEmail: quote.customer_email,
      customerPhone: quote.customer_phone,
      customerAddress: quote.customer_address,
      deliveryAccess: quote.delivery_access,
      status: quote.status || 'quote',
      paymentStatus: quote.payment_status,
      paymentMethod: quote.payment_method,
      paidAt: quote.paid_at,
      items: quote.items || [],
      notes: quote.notes || '',
      taxRate: 10,
      total: parseFloat(quote.total) || 0,
      subtotal: parseFloat(quote.subtotal) || 0,
      gst: parseFloat(quote.gst) || 0,
      quote_number: quote.quote_number
    }));
  }
};
