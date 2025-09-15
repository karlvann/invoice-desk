'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CreditCard, Download, Home, Check, ChevronRight, Shield, Clock, Mail } from 'lucide-react';
import Link from 'next/link';
import PaymentForm from '../../../components/PaymentForm';
import DeliveryAccessModal from '../../../components/DeliveryAccessModal';
import Image from 'next/image';

// Sample invoice data (in a real app, this would come from a database)
const sampleInvoices = {
  'draft': {
    id: 'draft',
    invoiceNumber: 'QUOTE-2025-001',
    date: new Date().toISOString().split('T')[0],
    customerName: 'John Smith',
    customerEmail: 'john@example.com',
    customerPhone: '0412 345 678',
    customerAddress: '123 Test St\nSydney NSW 2000',
    items: [
      {
        sku: 'Cloud10queen',
        name: 'Cloud 10 - firmer - Queen',
        quantity: 1,
        price: 2940
      }
    ],
    notes: 'Thank you for choosing ausbeds for your sleep solution.',
    taxRate: 10,
    status: 'sent'
  }
};

export default function QuotePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const autopay = searchParams.get('autopay') === 'true';
  const [invoice, setInvoice] = useState<any>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deliveryAccess, setDeliveryAccess] = useState<string>('');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [savingDeliveryAccess, setSavingDeliveryAccess] = useState(false);

  // Auto-trigger payment form when autopay parameter is present
  useEffect(() => {
    if (autopay && invoice && !loading) {
      // Small delay to ensure page is fully rendered
      setTimeout(() => {
        setShowPaymentForm(true);
      }, 500);
    }
  }, [autopay, invoice, loading]);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch(`/api/quotes/${id}`);
        if (response.ok) {
          const data = await response.json();
          // Convert database format to component format
          const quote = data.quote;
          const formattedInvoice = {
            id: quote.quote_number,
            invoiceNumber: quote.quote_number,
            date: quote.created_at,
            customerName: quote.customer_name,
            customerEmail: quote.customer_email,
            customerPhone: quote.customer_phone,
            customerAddress: quote.customer_address,
            items: JSON.parse(quote.items),
            notes: 'Thank you for choosing ausbeds for your sleep solution.',
            taxRate: 10,
            total: quote.total,
            status: quote.status,
            paymentStatus: quote.payment_status,
            deliveryAccess: quote.delivery_access || ''
          };
          setInvoice(formattedInvoice);
          setDeliveryAccess(quote.delivery_access || '');
        } else {
          // Fallback to localStorage and sample data
          const savedInvoices = localStorage.getItem('invoices');
          if (savedInvoices) {
            const invoices = JSON.parse(savedInvoices);
            const foundInvoice = invoices.find((inv: any) => inv.id?.toString() === id);
            if (foundInvoice) {
              setInvoice(foundInvoice);
            } else {
              setInvoice(sampleInvoices[id as keyof typeof sampleInvoices] || sampleInvoices.draft);
            }
          } else {
            setInvoice(sampleInvoices[id as keyof typeof sampleInvoices] || sampleInvoices.draft);
          }
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
        // Fallback to sample data
        setInvoice(sampleInvoices[id as keyof typeof sampleInvoices] || sampleInvoices.draft);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [id]);

  const handlePayment = () => {
    console.log('Pay Now clicked');
    // Proceed directly to payment without checking delivery access
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    alert('Payment successful! Thank you for your purchase.');
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
  };

  const handleDeliveryAccessSelect = async (option: string) => {
    setSavingDeliveryAccess(true);
    try {
      // Save delivery access to the database
      const response = await fetch(`/api/quotes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deliveryAccess: option
        }),
      });

      if (response.ok) {
        setDeliveryAccess(option);
        setShowDeliveryModal(false);
      } else {
        alert('Failed to save delivery access. Please try again.');
      }
    } catch (error) {
      console.error('Error saving delivery access:', error);
      alert('Failed to save delivery access. Please try again.');
    } finally {
      setSavingDeliveryAccess(false);
    }
  };

  const getDeliveryAccessDisplay = () => {
    switch (deliveryAccess) {
      case 'Ground floor':
        return 'Ground floor';
      case 'Lift access':
        return 'Lift access';
      case 'No stairs':
        return 'No stairs';
      case 'Few steps':
        return 'Few steps';
      case 'Flight of stairs':
        return 'Flight of stairs';
      case '1 flight of stairs':
        return '1 flight of stairs';
      case '2 flights of stairs':
        return '2 flights of stairs';
      case '3 flights of stairs':
        return '3 flights of stairs';
      case '4+ flights of stairs':
        return '4+ flights of stairs';
      case 'Stairs no help':
        return 'Stairs - extra driver needed (+$50)';
      case 'Call needed':
        return 'Please call';
      default:
        return deliveryAccess; // Return as-is for any new formats
    }
  };

  const hasExtraDeliveryFee = deliveryAccess === 'Stairs no help';
  const extraDeliveryFee = hasExtraDeliveryFee ? 50 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E6E9EC] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5469D4] mx-auto mb-4"></div>
          <p className="text-[#697386]">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E6E9EC] text-center max-w-md">
          <h1 className="text-2xl font-semibold text-[#0A2540] mb-4">Quote Not Found</h1>
          <p className="text-[#697386] mb-6">
            The quote you&apos;re looking for doesn&apos;t exist or may have expired.
          </p>
          <p className="text-[#0A2540]">
            Please contact <a href="mailto:sales@ausbeds.com.au" className="text-[#5469D4] hover:text-[#4456C7]">sales@ausbeds.com.au</a> for assistance.
          </p>
        </div>
      </div>
    );
  }

  // Calculate totals
  const subtotal = invoice.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
  const totalWithDelivery = subtotal + extraDeliveryFee;
  const gstAmount = totalWithDelivery * (invoice.taxRate / (100 + invoice.taxRate));
  const exGstAmount = totalWithDelivery - gstAmount;


  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        @media print {
          body {
            background: white !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:border-0 {
            border-width: 0 !important;
          }
          
          .print\\:bg-white {
            background-color: white !important;
          }
          
          .print\\:text-black {
            color: black !important;
          }
        }
      `}} />
      
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {showPaymentForm ? (
          <div>
            <div className="mb-6">
              <button
                onClick={handlePaymentCancel}
                className="inline-flex items-center gap-2 text-[#5469D4] hover:text-[#4456C7] transition-colors font-medium"
              >
                <span className="mr-2">←</span>
                Back to quote
              </button>
            </div>
            <PaymentForm
              invoice={{...invoice, deliveryAccess}}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </div>
        ) : (
          <div>
            {/* Premium Header */}
            <div className="text-center mb-12 print:hidden">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F0E5FF]/30 rounded-full mb-6">
                <Shield className="w-4 h-4 text-[#5469D4]" />
                <span className="text-sm font-medium text-[#5469D4]">Secure Checkout</span>
              </div>
              <h1 className="text-4xl font-light text-[#0A2540] mb-3">Complete Your Purchase</h1>
              <p className="text-lg text-[#425466]">Premium mattress delivery to your door</p>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-8 print:hidden">
              {/* Left Column - Quote Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quote Summary Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#E6E9EC] overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-medium text-[#0A2540]">Quote Summary</h2>
                      <span className="text-sm text-[#697386] bg-[#F6F9FC] px-3 py-1 rounded-full">
                        {invoice.invoiceNumber}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-4 mb-8">
                      {invoice.items.map((item: any, index: number) => (
                        <div key={index} className="flex items-start justify-between p-4 bg-[#F6F9FC] rounded-xl">
                          <div className="flex-1">
                            <h3 className="font-medium text-[#0A2540] mb-1">{item.name}</h3>
                            <p className="text-sm text-[#697386]">SKU: {item.sku} · Quantity: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-[#0A2540]">${(item.quantity * item.price).toFixed(2)}</p>
                            <p className="text-sm text-[#697386]">${item.price.toFixed(2)} each</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Delivery Access */}
                    <div className="border-t border-[#E6E9EC] pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-[#0A2540]">Delivery Access</h3>
                        <button
                          onClick={() => setShowDeliveryModal(true)}
                          className="text-sm text-[#5469D4] hover:text-[#4456C7] font-medium"
                        >
                          Change
                        </button>
                      </div>
                      <div className={`p-4 rounded-xl ${deliveryAccess ? 'bg-[#E5FFE5]' : 'bg-[#FFF5E5]'}`}>
                        <div className="flex items-center gap-3">
                          <Home className={`w-5 h-5 ${deliveryAccess ? 'text-[#00875A]' : 'text-[#FF8B00]'}`} />
                          <div className="flex-1">
                            <p className={`font-medium ${deliveryAccess ? 'text-[#00875A]' : 'text-[#FF8B00]'}`}>
                              {deliveryAccess ? getDeliveryAccessDisplay() : 'Please select delivery access'}
                            </p>
                            {hasExtraDeliveryFee && (
                              <p className="text-sm text-[#697386] mt-1">
                                Additional $50 delivery fee applies
                              </p>
                            )}
                          </div>
                          {deliveryAccess && <Check className="w-5 h-5 text-[#00875A]" />}
                        </div>
                      </div>
                    </div>

                    {/* Totals */}
                    <div className="border-t border-[#E6E9EC] pt-6 mt-6 space-y-3">
                      <div className="flex justify-between text-[#697386]">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      {hasExtraDeliveryFee && (
                        <div className="flex justify-between text-[#697386]">
                          <span>Delivery (stairs assistance)</span>
                          <span>+${extraDeliveryFee.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm text-[#697386]">
                        <span>GST included</span>
                        <span>${gstAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-semibold text-[#0A2540] pt-3 border-t border-[#E6E9EC]">
                        <span>Total</span>
                        <span>${totalWithDelivery.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Details Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#E6E9EC] p-8">
                  <h2 className="text-xl font-medium text-[#0A2540] mb-6">Delivery Details</h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-[#697386] mb-1">Customer</p>
                      <p className="font-medium text-[#0A2540]">{invoice.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#697386] mb-1">Email</p>
                      <p className="font-medium text-[#0A2540]">{invoice.customerEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#697386] mb-1">Phone</p>
                      <p className="font-medium text-[#0A2540]">{invoice.customerPhone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#697386] mb-1">Address</p>
                      <p className="font-medium text-[#0A2540] whitespace-pre-line">{invoice.customerAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Payment Action */}
              <div className="lg:col-span-1">
                <div className="sticky top-8 space-y-6">
                  {/* Payment Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-[#E6E9EC] p-6">
                    <div className="text-center mb-6">
                      <p className="text-sm text-[#697386] mb-2">Amount due today</p>
                      <p className="text-3xl font-light text-[#0A2540]">${totalWithDelivery.toFixed(2)}</p>
                    </div>
                    
                    <button
                      onClick={handlePayment}
                      className="w-full px-6 py-4 bg-[#5469D4] text-white rounded-xl hover:bg-[#4456C7] transition-all transform hover:scale-[1.02] inline-flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#5469D4]/20"
                    >
                      <CreditCard className="w-5 h-5" />
                      Pay with Card
                    </button>

                    <div className="mt-6 space-y-3">
                      <div className="flex items-center gap-3 text-sm text-[#697386]">
                        <Shield className="w-4 h-4 text-[#00875A]" />
                        <span>Secure payment by Stripe</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[#697386]">
                        <Clock className="w-4 h-4 text-[#5469D4]" />
                        <span>Quote valid for 30 days</span>
                      </div>
                    </div>
                  </div>

                  {/* Benefits Card */}
                  <div className="bg-[#F0E5FF]/20 rounded-2xl p-6 border border-[#E5E5FF]">
                    <h3 className="font-medium text-[#0A2540] mb-4">Your Purchase Includes</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#E5E5FF] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-[#5469D4]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#0A2540]">Free Delivery</p>
                          <p className="text-sm text-[#697386]">White glove service included</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#E5E5FF] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-[#5469D4]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#0A2540]">100 Night Trial</p>
                          <p className="text-sm text-[#697386]">Love it or return it</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#E5E5FF] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-[#5469D4]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#0A2540]">10 Year Warranty</p>
                          <p className="text-sm text-[#697386]">Premium quality guaranteed</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => window.print()}
                      className="w-full px-4 py-3 bg-white text-[#697386] rounded-xl hover:bg-[#F6F9FC] transition-colors inline-flex items-center justify-center gap-2 font-medium border border-[#E6E9EC]"
                    >
                      <Download className="w-4 h-4" />
                      Download Quote
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-16 text-center print:hidden">
              <div className="bg-[#E5FFE5]/30 rounded-2xl p-8 inline-block border border-[#E5FFE5]">
                <p className="text-[#697386] mb-2">Need assistance with your order?</p>
                <p className="text-[#0A2540] font-medium">
                  Contact us at <a href="mailto:sales@ausbeds.com.au" className="text-[#5469D4] hover:text-[#4456C7]">sales@ausbeds.com.au</a>
                </p>
              </div>
              
              <div className="mt-8 text-sm text-[#697386]">
                <p>ausbeds · 136 Victoria Rd, Marrickville NSW 2204 · ABN: 46 161 365 742</p>
              </div>
            </div>

            {/* Print Version */}
            <div className="hidden print:block">
              <div className="bg-white max-w-4xl mx-auto">
                {/* Print Header */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold mb-2">ausbeds</h1>
                  <p className="text-sm text-gray-600">QUOTE</p>
                </div>

                {/* Company Info */}
                <div className="text-center mb-8 text-sm text-gray-600">
                  <p>136 Victoria Rd, Marrickville NSW 2204</p>
                  <p>ABN: 46 161 365 742</p>
                </div>

                {/* Quote Details Grid */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="font-semibold mb-2">Quote Details:</h3>
                    <p>Quote #: {invoice.invoiceNumber}</p>
                    <p>Date: {new Date(invoice.date).toLocaleDateString('en-AU')}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Bill To:</h3>
                    <p>{invoice.customerName}</p>
                    <p>{invoice.customerEmail}</p>
                    <p>{invoice.customerPhone}</p>
                    <p className="whitespace-pre-line">{invoice.customerAddress}</p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-8">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-2">SKU</th>
                      <th className="text-left py-2">Description</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Price (Inc. GST)</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item: any, index: number) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-2">{item.sku}</td>
                        <td className="py-2">{item.name}</td>
                        <td className="text-right py-2">{item.quantity}</td>
                        <td className="text-right py-2">${item.price.toFixed(2)}</td>
                        <td className="text-right py-2">${(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                  <div className="w-64">
                    <div className="flex justify-between py-1">
                      <span>Subtotal (GST Inc.):</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {hasExtraDeliveryFee && (
                      <div className="flex justify-between py-1">
                        <span>Delivery Fee:</span>
                        <span>${extraDeliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 text-sm">
                      <span>GST Amount (10%):</span>
                      <span>${gstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 text-sm">
                      <span>Ex-GST Amount:</span>
                      <span>${exGstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 font-semibold border-t-2 border-gray-300">
                      <span>Total Due:</span>
                      <span>${totalWithDelivery.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <div className="mb-8">
                    <h3 className="font-semibold mb-2">Notes:</h3>
                    <p>{invoice.notes}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="text-center text-sm text-gray-600 mt-12">
                  <p>All prices shown include GST</p>
                  <p className="mt-4">This quote is valid for 30 days from the date issued.</p>
                  <p className="mt-4">Questions about this quote?</p>
                  <p>Contact us at sales@ausbeds.com.au</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delivery Access Modal */}
      <DeliveryAccessModal
        isOpen={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
        onSelect={handleDeliveryAccessSelect}
      />
    </div>
  );
}
