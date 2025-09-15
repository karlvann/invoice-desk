import { useState, useEffect } from 'react';
import { Invoice } from '../types/invoice';

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quotes');
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      
      const data = await response.json();
      // Map database fields to component fields
      const mappedQuotes = (data.quotes || []).map((quote: any) => ({
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
      setInvoices(mappedQuotes);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices');
      // Try to load from localStorage as fallback
      const savedInvoices = localStorage.getItem('invoices');
      if (savedInvoices) {
        setInvoices(JSON.parse(savedInvoices));
      }
    } finally {
      setLoading(false);
    }
  };

  const saveInvoice = async (invoiceData: Invoice) => {
    // Validate email before sending to API
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!invoiceData.customerEmail || !emailRegex.test(invoiceData.customerEmail)) {
      throw new Error('A valid email address is required to create an invoice');
    }

    const response = await fetch('/api/quotes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });

    if (!response.ok) {
      throw new Error('Failed to save invoice');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to save invoice');
    }

    await fetchInvoices(); // Refresh the list
    return result;
  };

  const updateInvoiceStatus = async (quoteNumber: string, status: string, paymentStatus?: string) => {
    const response = await fetch(`/api/quotes/${quoteNumber}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        paymentStatus
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update invoice status');
    }

    await fetchInvoices(); // Refresh the list
  };

  const deleteInvoices = async (quoteNumbers: string[]) => {
    const response = await fetch('/api/quotes/bulk-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quoteNumbers
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete invoices');
    }

    await fetchInvoices(); // Refresh the list
    return result;
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    saveInvoice,
    updateInvoiceStatus,
    deleteInvoices
  };
};
