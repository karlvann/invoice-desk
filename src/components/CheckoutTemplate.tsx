'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '@/components/PaymentForm';
import { BUSINESS_INFO } from '@/config/business';
import Image from 'next/image';
import { CreditCard, Package, User, Shield, Truck, Clock, ChevronRight, Star, Check, Phone, MapPin } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutTemplateProps {
  initialQuote?: any;
  onUpdateCustomer?: (details: any) => Promise<any>;
}

export default function CheckoutTemplate({ initialQuote, onUpdateCustomer }: CheckoutTemplateProps) {
  const router = useRouter();
  // Always start at Review (step 1) unless we have complete customer details
  const [currentStep, setCurrentStep] = useState(
    initialQuote?.customer_name && 
    initialQuote?.customer_name !== 'Pending' && 
    initialQuote?.customer_email &&
    initialQuote?.customer_email !== '' 
      ? 3  // Skip to payment if we have full details
      : 1  // Otherwise start at Review
  );
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Customer details state
  const [customerDetails, setCustomerDetails] = useState({
    name: initialQuote?.customer_name || initialQuote?.customerName || '',
    email: initialQuote?.customer_email || initialQuote?.customerEmail || '',
    phone: initialQuote?.customer_phone || initialQuote?.customerPhone || '',
    address: initialQuote?.customer_address || initialQuote?.customerAddress || ''
  });

  // Use provided quote or sample data for preview
  // Convert string values to numbers if coming from database
  const sampleQuote = initialQuote ? {
    ...initialQuote,
    subtotal: parseFloat(initialQuote.subtotal || 0),
    gst: parseFloat(initialQuote.gst || 0),
    total: parseFloat(initialQuote.total || 0),
    items: initialQuote.items?.map((item: any) => ({
      ...item,
      price: parseFloat(item.price || 0),
      quantity: parseInt(item.quantity || 1)
    })) || []
  } : {
    quote_number: 'INV-202412-001',
    items: [{
      name: 'Premium Mattress - King Size',
      sku: 'PM-KING-001',
      quantity: 1,
      price: 2999.00
    }],
    subtotal: 2726.36,
    gst: 272.64,
    total: 2999.00
  };

  const steps = [
    { id: 1, name: 'Review', icon: Package },
    { id: 2, name: 'Details', icon: User },
    { id: 3, name: 'Payment', icon: CreditCard }
  ];

  const faqs = [
    {
      question: "When will my mattress arrive?",
      answer: "We'll call you within 48 hours to arrange a convenient 2-hour delivery window. Most deliveries happen within 7-10 business days."
    },
    {
      question: "What if I don't love it?",
      answer: "You have 100 nights to try your mattress. If you're not completely satisfied, we'll arrange a free pickup and full refund."
    },
    {
      question: "Do you remove my old mattress?",
      answer: "Yes! We offer old mattress removal for a small fee. Just let us know when we arrange delivery."
    }
  ];

  const handleCustomerDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerDetails.name || !customerDetails.email) {
      alert('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);

    try {
      // Call the parent's update function if provided
      if (onUpdateCustomer) {
        await onUpdateCustomer({
          customerName: customerDetails.name,
          customerEmail: customerDetails.email,
          customerPhone: customerDetails.phone,
          customerAddress: customerDetails.address
        });
      }
      setCurrentStep(3);
    } catch (err) {
      alert('Failed to save customer details. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    router.push(`/payment/success?quote=${sampleQuote.quote_number || sampleQuote.quoteNumber}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-zinc-50">
      {/* Header - Enhanced */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-gray-900">AUSBEDS</div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                <Shield className="w-3 h-3" />
                <span>Secure Checkout</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">0450 606 589</span>
              <span className="text-gray-400">|</span>
              <span>Quote #{sampleQuote.quote_number || sampleQuote.quoteNumber}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress indicator - More visual */}
        <div className="mb-10">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center ${currentStep >= step.id ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep >= step.id 
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200' 
                      : 'bg-gray-200'
                  }`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <span className="ml-3 font-semibold hidden sm:inline">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 sm:w-20 h-1 mx-2 transition-all ${
                    currentStep > step.id ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main card with better shadows */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          
          {/* Step 1: Review - Enhanced */}
          {currentStep === 1 && (
            <div className="p-8 lg:p-10">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Almost There!</h2>
                <p className="text-gray-600">Let&apos;s review your custom mattress order</p>
              </div>
              
              {/* Product showcase */}
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-6 mb-8 border border-emerald-100">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                      <Star className="w-3 h-3" />
                      CUSTOM BUILT FOR YOU
                    </div>
                    <h3 className="font-bold text-xl text-gray-900 mb-2">{sampleQuote.items[0].name}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <span>SKU: {sampleQuote.items[0].sku}</span>
                      <span>•</span>
                      <span>Qty: {sampleQuote.items[0].quantity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">${sampleQuote.total.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">GST included</p>
                  </div>
                </div>
                
                {/* Price breakdown */}
                <div className="bg-white/80 backdrop-blur rounded-xl p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal (inc. GST)</span>
                      <span className="font-medium">${sampleQuote.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">GST Amount</span>
                      <span className="font-medium">${sampleQuote.gst.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-semibold text-gray-900">Total Amount</span>
                      <span className="font-bold text-xl text-emerald-600">${sampleQuote.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* What's Included - More personality */}
              <div className="mb-8">
                <p className="text-sm font-semibold text-gray-700 mb-4">What you&apos;re getting:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 bg-emerald-50 rounded-xl p-4">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Free Delivery</p>
                      <p className="text-xs text-gray-600 mt-0.5">Sydney Metro area</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">10 Year Warranty</p>
                      <p className="text-xs text-gray-600 mt-0.5">Australian made quality</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 bg-purple-50 rounded-xl p-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-purple-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">100 Night Trial</p>
                      <p className="text-xs text-gray-600 mt-0.5">Love it or return it</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust section with Karl */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-6 mb-8 border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    K
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Karl says:</p>
                    <p className="text-sm text-gray-600 italic">
                      &ldquo;No BS here - this mattress is built specifically for your body weight. 
                      If it&apos;s not perfect, we&apos;ll adjust it. That&apos;s my promise.&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-2xl font-semibold text-lg hover:from-emerald-700 hover:to-teal-700 transition-all transform hover:scale-[1.01] shadow-lg flex items-center justify-center gap-2"
              >
                Continue to Details
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Details - More friendly */}
          {currentStep === 2 && (
            <div className="p-8 lg:p-10">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Your Details</h2>
                <p className="text-gray-600 mt-1">We need this to deliver your amazing new mattress</p>
              </div>
              
              <form onSubmit={handleCustomerDetailsSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerDetails.name}
                      onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={customerDetails.email}
                      onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={customerDetails.phone}
                    onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
                    placeholder="0400 000 000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address
                  </label>
                  <textarea
                    value={customerDetails.address}
                    onChange={(e) => setCustomerDetails({...customerDetails, address: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
                    rows={3}
                    placeholder="123 Main St, Suburb NSW 2000"
                  />
                </div>

                {/* What happens next */}
                <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    What happens after you order?
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-amber-700">1</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">We call you</p>
                        <p className="text-xs text-gray-600">We&apos;ll call you to arrange a convenient 2-hour window</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-amber-700">2</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">White glove delivery</p>
                        <p className="text-xs text-gray-600">We&apos;ll bring it to your bedroom and remove packaging</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                  >
                    {isProcessing ? 'Processing...' : 'Continue to Payment'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Payment - Enhanced */}
          {currentStep === 3 && (
            <div className="p-8 lg:p-10">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
                <p className="text-gray-600 mt-1">Final step - let&apos;s complete your order</p>
              </div>
              
              {/* Order Summary - Enhanced */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 mb-8 border border-emerald-100">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">You&apos;re purchasing:</p>
                    <p className="font-bold text-gray-900 text-lg">{sampleQuote.items[0].name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">
                      ${sampleQuote.total.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">GST included</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <Check className="w-4 h-4" />
                  <span className="font-medium">100-night trial included</span>
                </div>
              </div>
              
              {/* Stripe Payment Form */}
              {initialQuote ? (
                <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                  <Elements stripe={stripePromise}>
                    <PaymentForm
                      invoice={{
                        ...initialQuote,
                        customerName: customerDetails.name,
                        customerEmail: customerDetails.email,
                        customerPhone: customerDetails.phone,
                        customerAddress: customerDetails.address,
                        quoteNumber: initialQuote.quote_number || initialQuote.quoteNumber
                      }}
                      onSuccess={handlePaymentSuccess}
                      onCancel={() => setCurrentStep(2)}
                    />
                  </Elements>
                </div>
              ) : (
                /* Preview mode - no real payment */
                <div className="bg-gray-50 rounded-2xl p-8 mb-8">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center">
                      <CreditCard className="w-8 h-8 text-gray-700" />
                    </div>
                  </div>
                  <p className="text-center font-semibold text-gray-900 mb-2">Secure Payment</p>
                  <p className="text-center text-sm text-gray-600 mb-6">Powered by Stripe - Your card details are encrypted</p>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-white">
                    <p className="text-sm text-gray-500 text-center">Stripe payment form loads here</p>
                  </div>
                </div>
              )}

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center">
                  <Shield className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-700">SSL Encrypted</p>
                </div>
                <div className="text-center">
                  <Check className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-700">PCI Compliant</p>
                </div>
                <div className="text-center">
                  <Star className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-gray-700">5 Star Reviews</p>
                </div>
              </div>

              {!initialQuote && (
                <button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-2xl font-semibold text-lg hover:from-emerald-700 hover:to-teal-700 transition-all transform hover:scale-[1.01] shadow-lg">
                  Complete Order • ${sampleQuote.total.toFixed(2)}
                </button>
              )}

              <button
                onClick={() => setCurrentStep(2)}
                className="w-full mt-4 text-sm text-emerald-600 hover:text-emerald-800 font-medium"
              >
                ← Back to delivery details
              </button>
            </div>
          )}
        </div>

        {/* Footer - Trust & Support */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-6 mb-6">
            <Image 
              src="/stripe.svg" 
              alt="Stripe" 
              width={70}
              height={28}
              className="opacity-70 hover:opacity-100 transition-opacity"
            />
            <div className="flex items-center gap-2 text-gray-500">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">256-bit SSL</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            <p className="mb-2">Questions? Call us on 0450 606 589</p>
            <p>© 2024 Ausbeds. All rights reserved.</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Questions</h3>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 text-sm">{faq.question}</span>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedFaq === index ? 'rotate-90' : ''}`} />
                </button>
                {expandedFaq === index && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}