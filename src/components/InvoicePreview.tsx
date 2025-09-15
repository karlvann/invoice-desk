import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { calculateGSTComponent, calculateExGST } from '../utils/calculations';
import { formatDate } from '../utils/invoice';
import { BUSINESS_INFO } from '../config/business';
import { Printer, Edit2, Download } from 'lucide-react';
import ProductionLabel from './ProductionLabel';
import PaymentStatusManager from './PaymentStatusManager';
import PaymentStatusBadge, { PaymentLinkButton } from './PaymentStatusBadge';
import { isPaid } from '@/utils/paymentStatus';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { mattressLayers } from '../data/mattressLayers';

interface InvoicePreviewProps {
  invoice: any;
  deliveryAccess?: string;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, deliveryAccess }) => {
  const [isAddedToActiveCampaign, setIsAddedToActiveCampaign] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState('');
  const [showDeliveryInput, setShowDeliveryInput] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Toggle between Zapier and direct ActiveCampaign integration
  const useDirectActiveCampaign = process.env.NEXT_PUBLIC_USE_DIRECT_ACTIVECAMPAIGN === 'true';

  // Check if this invoice has already been added to ActiveCampaign
  useEffect(() => {
    const addedInvoices = localStorage.getItem('activeCampaignInvoices');
    if (addedInvoices) {
      const invoiceIds = JSON.parse(addedInvoices);
      setIsAddedToActiveCampaign(invoiceIds.includes(invoice.id || invoice.invoiceNumber));
    }
  }, [invoice.id, invoice.invoiceNumber]);

  // Check if invoice has Cloud or Aurora King/Queen mattresses that need labels
  const hasLabelProducts = invoice.items.some((item: any) => {
    if (!item.sku) return false;
    const skuLower = item.sku.toLowerCase();
    
    // Check if it's Cloud or Aurora
    const isCloudOrAurora = skuLower.startsWith('cloud') || skuLower.startsWith('aurora');
    
    // Check if it's King or Queen size
    const isKingOrQueen = skuLower.includes('king') || skuLower.includes('queen');
    
    return isCloudOrAurora && isKingOrQueen;
  });

  // Get label items for printing
  const getLabelItems = () => {
    return invoice.items.filter((item: any) => {
      if (!item.sku) return false;
      const skuLower = item.sku.toLowerCase();
      const isCloudOrAurora = skuLower.startsWith('cloud') || skuLower.startsWith('aurora');
      const isKingOrQueen = skuLower.includes('king') || skuLower.includes('queen');
      return isCloudOrAurora && isKingOrQueen;
    }).flatMap((item: any) => {
      // Extract range, model, and size from the item name
      const nameParts = item.name.split(' - ');
      const productInfo = nameParts[0].split(' ');
      const range = productInfo[0];
      const model = parseInt(productInfo[1]) || 0;
      const size = productInfo[productInfo.length - 1];
      
      // Create one label for each quantity
      const labels = [];
      for (let i = 0; i < item.quantity; i++) {
        labels.push({
          productName: item.name,
          customerName: invoice.customerName,
          customerAddress: invoice.customerAddress,
          size: size,
          model: model,
          range: range
        });
      }
      return labels;
    });
  };

  // Get layer data for a mattress item
  const getLayerData = (item: any) => {
    const name = (item.name || '').toLowerCase();
    const sku = (item.sku || '').toLowerCase();
    
    let model = '';
    let firmness = 0;
    
    // Detect model
    if (sku.includes('cloud') || name.includes('cloud')) model = 'cloud';
    else if (sku.includes('aurora') || name.includes('aurora')) model = 'aurora';
    else if (sku.includes('cooper') || name.includes('cooper')) model = 'cooper';
    else return null;
    
    // Extract firmness from name (e.g., "Cloud 7 - King")
    const firmMatch = name.match(/\b(\d+)\b/);
    if (firmMatch) {
      firmness = parseInt(firmMatch[1]);
    }
    
    return mattressLayers.find(m => m.model === model && m.firmness === firmness);
  };

  const handleDownloadPDF = () => {
    const doc = generateInvoicePDF(invoice);
    doc.save(`invoice-${invoice.invoiceNumber || 'draft'}.pdf`);
  };

  const handlePrintLabels = () => {
    const labelItems = getLabelItems();
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print labels');
      return;
    }
    
    // Get the label component HTML
    const labelContainer = document.createElement('div');
    const root = require('react-dom/client').createRoot(labelContainer);
    root.render(<ProductionLabel items={labelItems} />);
    
    // Wait a moment for React to render
    setTimeout(() => {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Production Labels</title>
            <style>
              @media print {
                body { margin: 0; }
                .production-label { page-break-after: always; }
              }
            </style>
          </head>
          <body>
            ${labelContainer.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }, 100);
  };

  const handleAddToActiveCampaign = async () => {
    setIsLoading(true);
    try {
      // Choose endpoint based on toggle
      const endpoint = useDirectActiveCampaign ? '/api/activecampaign' : '/api/zapier-webhook';
      
      const requestData: any = {
        customerEmail: invoice.customerEmail,
        customerName: invoice.customerName,
        customerPhone: invoice.customerPhone,
        customerAddress: invoice.customerAddress,
        shippingAddress: invoice.customerAddress, // Using customer address as shipping
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.total || invoice.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0)
      };

      // Add delivery time if using direct integration
      if (useDirectActiveCampaign && deliveryTime) {
        requestData.deliveryTime = deliveryTime;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        // Mark as added in localStorage
        const addedInvoices = localStorage.getItem('activeCampaignInvoices');
        const invoiceIds = addedInvoices ? JSON.parse(addedInvoices) : [];
        invoiceIds.push(invoice.id || invoice.invoiceNumber);
        localStorage.setItem('activeCampaignInvoices', JSON.stringify(invoiceIds));
        
        setIsAddedToActiveCampaign(true);
        setShowDeliveryInput(false);
        alert('Contact successfully added to ActiveCampaign!');
      } else {
        alert('Failed to add contact to ActiveCampaign. Please try again.');
      }
    } catch (error) {
      console.error('Error adding to ActiveCampaign:', error);
      alert('Failed to add contact to ActiveCampaign. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  // Recalculate GST for display purposes
  const total = invoice.total || invoice.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
  const gstAmount = invoice.gstAmount || calculateGSTComponent(total);
  const exGstAmount = invoice.exGstAmount || calculateExGST(total);
  
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden max-w-4xl mx-auto print:shadow-none">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#E5E5FF] via-[#F0E5FF] to-[#FFE5F5] p-8 text-center relative">
        <div className="absolute top-4 right-4 flex gap-2 print:hidden">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
        <div className="flex justify-center mb-4">
          <Image
            src="/images/logo-black.svg"
            alt={BUSINESS_INFO.name}
            width={160}
            height={48}
            className="h-12 w-auto"
          />
        </div>
        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Invoice</p>
      </div>

      {/* Content */}
      <div className="p-8 lg:p-12">
        {/* Invoice Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Invoice Details</h3>
            <div className="space-y-2">
              <p className="text-gray-900">
                <span className="text-gray-500">Invoice #:</span> {invoice.invoiceNumber || 'DRAFT'}
              </p>
              <p className="text-gray-900">
                <span className="text-gray-500">Date:</span> {formatDate(invoice.date)}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Payment Status:</span> 
                <PaymentStatusBadge 
                  invoice={invoice}
                  showPayLink={true}
                  size="medium"
                />
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Edit payment status"
                >
                  <Edit2 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Bill To</h3>
            <div className="space-y-1">
              <p className="text-gray-900 font-medium">{invoice.customerName}</p>
              <p className="text-gray-600">{invoice.customerEmail}</p>
              <p className="text-gray-600">{invoice.customerPhone}</p>
              <p className="text-gray-600 whitespace-pre-line">{invoice.customerAddress}</p>
            </div>
          </div>
        </div>

        {/* Payment Button for Unpaid Invoices */}
        {!isPaid(invoice) && invoice.quote_number && (
          <div className="mb-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg print:hidden">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Required</h3>
              <p className="text-gray-600 mb-4">This invoice has not been paid yet.</p>
              <PaymentLinkButton 
                invoice={invoice} 
                className="mx-auto"
              />
            </div>
          </div>
        )}

        {/* Delivery Access Alert */}
        {deliveryAccess && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-amber-600 mr-2">📦</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Delivery Access</p>
                <p className="text-sm text-gray-600">
                  {deliveryAccess === 'Call needed' ? '📞 Please call customer before delivery' : deliveryAccess}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ActiveCampaign Integration - Only show for paid invoices */}
        {isPaid(invoice) && (
          <div className="mb-8 p-4 bg-purple-50 border border-purple-200 rounded-lg print:hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="activeCampaign"
                    checked={showDeliveryInput || isAddedToActiveCampaign}
                    onChange={(e) => {
                      if (!isAddedToActiveCampaign) {
                        if (e.target.checked) {
                          setShowDeliveryInput(true);
                        } else {
                          setShowDeliveryInput(false);
                          setDeliveryTime('');
                        }
                      }
                    }}
                    disabled={isAddedToActiveCampaign || isLoading}
                    className="h-5 w-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500 disabled:opacity-50"
                  />
                  <label htmlFor="activeCampaign" className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {isAddedToActiveCampaign ? 'Added to ActiveCampaign' : 'Add to ActiveCampaign'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {isAddedToActiveCampaign 
                        ? 'This contact has been added to your email list' 
                        : useDirectActiveCampaign 
                          ? 'Add to "Your mattress is coming tomorrow" list'
                          : 'Check to add this customer to your ActiveCampaign list via Zapier'}
                    </p>
                  </label>
                </div>
                {isLoading && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                )}
              </div>
              
              {/* Delivery Time Input - Only show when checkbox is checked and using direct integration */}
              {showDeliveryInput && !isAddedToActiveCampaign && (
                <div className="ml-8 space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      placeholder="e.g., 11-3pm, morning, 2pm"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
                    />
                    <button
                      onClick={handleAddToActiveCampaign}
                      disabled={isLoading}
                      className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Adding...' : 'Add Contact'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Optional: Enter delivery time (will be tagged &quot;shipping tomorrow&quot;)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="mb-12">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Order Items</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Item</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Qty</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Price</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.items.map((item: any, index: number) => {
                  const layerData = getLayerData(item);
                  return (
                    <tr key={index}>
                      <td className="py-4 px-4">
                        <p className="text-gray-900 font-medium">{item.name}</p>
                        <p className="text-gray-500 text-sm">SKU: {item.sku}</p>
                        {layerData && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                            <p className="font-medium text-gray-700">Firmness: {layerData.firmness}/16</p>
                            <p>Spring: {layerData.mainSpringLayer} ({layerData.springsPosition})</p>
                            <div className="mt-1">
                              <span className="font-medium">Layers: </span>
                              {[layerData.layer5, layerData.layer4, layerData.layer3, layerData.layer2]
                                .filter(l => l && l !== '-')
                                .join(', ')}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="text-right py-4 px-4 text-gray-900">{item.quantity}</td>
                      <td className="text-right py-4 px-4 text-gray-900">${item.price.toFixed(2)}</td>
                      <td className="text-right py-4 px-4 text-gray-900 font-medium">${(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-500">GST ({invoice.taxRate}%)</span>
              <span className="text-gray-600">${gstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-500">Ex-GST Amount</span>
              <span className="text-gray-600">${exGstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 border-t border-gray-200">
              <span className="text-lg font-semibold text-gray-900">Total Due</span>
              <span className="text-lg font-semibold text-gray-900">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-8 p-4 bg-[#F5F5FF] rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
            <p className="text-gray-700">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p className="font-medium text-gray-700 mb-2">{BUSINESS_INFO.name}</p>
          <p>{BUSINESS_INFO.address} • ABN: {BUSINESS_INFO.abn}</p>
          <p className="mt-4">All prices shown include GST</p>
        </div>
      </div>

      {/* Payment Status Manager Modal */}
      {showPaymentModal && (
        <PaymentStatusManager
          quote={invoice}
          onClose={() => setShowPaymentModal(false)}
          onUpdate={() => {
            setShowPaymentModal(false);
            // Reload the page to refresh the invoice data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default InvoicePreview;
