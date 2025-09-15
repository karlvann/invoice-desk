// Client-safe CSV export utility

// Format items for display in CSV
const formatItems = (items: any[]) => {
  return items.map(item => `${item.name} (x${item.quantity})`).join(', ');
};

// Export invoices to CSV
export const exportInvoicesToCSV = (invoices: any[]): string => {
  const headers = [
    'Invoice #',
    'Date',
    'Customer Name',
    'Email',
    'Phone',
    'Address',
    'Items',
    'Total',
    'Status',
    'Payment Method'
  ];

  const rows = invoices.map(invoice => [
    invoice.invoiceNumber || invoice.quote_number || 'DRAFT',
    new Date(invoice.date || invoice.created_at).toLocaleDateString('en-AU'),
    invoice.customerName || invoice.customer_name,
    invoice.customerEmail || invoice.customer_email,
    invoice.customerPhone || invoice.customer_phone || '',
    (invoice.customerAddress || invoice.customer_address || '').replace(/\n/g, ' '),
    formatItems(invoice.items || []),
    `$${(invoice.total || 0).toFixed(2)}`,
    invoice.status || 'draft',
    invoice.paymentMethod || invoice.payment_method || ''
  ]);

  // Convert to CSV format
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
};
