import React, { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Trash2, Download, Calendar, User, Package, Search, Home, DollarSign, Menu, X, CreditCard, Mail, Send, CheckCircle, TrendingUp, Users, ShoppingCart, Code, Square, CheckSquare, RefreshCw, CloudUpload, FileDown, Printer, Edit2, Link } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from './PaymentForm';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Import extracted components
import InvoicePreview from './InvoicePreview';
import EmailModal from './EmailModal';
import PaymentModal from './PaymentModal';
import Toast, { ToastMessage } from './Toast';
import ProductionLabel from './ProductionLabel';
import { mattressLayers } from '../data/mattressLayers';
import Sidebar from './Sidebar';
import InvoiceFormOrdered from './invoice/InvoiceFormOrdered';
import InvoiceList from './invoice/InvoiceList';
import PaidInvoicesView from './invoice/PaidInvoicesView';

// Import configurations
import { generateProducts } from '../config/products';
import { BUSINESS_INFO, INVOICE_DEFAULTS } from '../config/business';
import { GST_RATE } from '../constants';

// Import utilities
import { calculateSubtotal, calculateTotal, calculateGSTComponent, calculateExGST } from '../utils/calculations';
import { generateInvoiceNumber, getStatusColor } from '../utils/invoice';
import { getNextSequentialInvoiceNumber } from '../utils/invoice-sequential';
import { exportInvoicesToCSV } from '../utils/csvExport';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const MattressInvoiceApp = () => {
  // Generate all products from imported configuration
  const allProducts = generateProducts();
  const router = useRouter();
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);
  
  // GORDON'S PAGINATION FIX - Stop loading the entire bloody database!
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50; // Show 50 invoices per page

  // Toast helper functions
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration?: number) => {
    const id = Date.now().toString();
    const toast: ToastMessage = { id, message, type, duration };
    setToastMessages(prev => [...prev, toast]);
  };

  const removeToast = (id: string) => {
    setToastMessages(prev => prev.filter(toast => toast.id !== id));
  };
  
  // Load invoices from database on component mount
  useEffect(() => {
    fetchInvoices(currentPage);
    
    // Check for success message from wizard
    const successMessage = sessionStorage.getItem('invoiceCreatedMessage');
    if (successMessage) {
      showToast(successMessage, 'success');
      sessionStorage.removeItem('invoiceCreatedMessage');
    }
    
    // Check for pending order from Astro site
    const pendingOrder = sessionStorage.getItem('pendingOrder');
    if (pendingOrder) {
      try {
        const orderData = JSON.parse(pendingOrder);
        // Clear the pending order
        sessionStorage.removeItem('pendingOrder');
        
        // If we have model, firmness, and size, find the product
        if (orderData.model && orderData.firmness && orderData.size) {
          const modelCapitalized = orderData.model.charAt(0).toUpperCase() + orderData.model.slice(1);
          const sizeNoSpaces = orderData.size.replace(/\s+/g, '');
          const skuToFind = `${modelCapitalized}${orderData.firmness}${sizeNoSpaces}`;
          
          const product = allProducts.find(p => 
            p.sku.toLowerCase() === skuToFind.toLowerCase()
          );
          
          if (product) {
            // Set up a fresh invoice with only the product
            setCurrentInvoice({
              invoiceNumber: '',
              date: new Date().toISOString().split('T')[0],
              customerName: '',
              customerEmail: '',
              customerPhone: '',
              customerAddress: '',
              items: [{
                sku: product.sku,
                name: product.name,
                quantity: 1,
                price: product.price
              }],
              notes: '',
              taxRate: GST_RATE,
              status: 'quote',
              deliveryAccess: '',
              deliveryDate: '',
              deliveryDateOption: 'specific',
              needsBase: undefined,
              floorType: '',
              total: 0,
              subtotal: 0,
              gst: 0
            });
            
            // Show the invoice form
            setCurrentView('new-invoice');
            setShowInvoiceForm(true);
          }
        } else if (orderData.product) {
          // Legacy format with product object - set up a fresh invoice
          setCurrentInvoice({
            invoiceNumber: '',
            date: new Date().toISOString().split('T')[0],
            customerName: '',
            customerEmail: '',
            customerPhone: '',
            customerAddress: '',
            items: [{
              sku: orderData.product.sku,
              name: orderData.product.name,
              quantity: orderData.quantity || 1,
              price: orderData.product.price
            }],
            notes: '',
            taxRate: GST_RATE,
            status: 'quote',
            deliveryAccess: '',
            deliveryDate: '',
            deliveryDateOption: 'specific',
            needsBase: undefined,
            floorType: '',
            total: 0,
            subtotal: 0,
            gst: 0
          });
          
          // Show the invoice form
          setCurrentView('new-invoice');
          setShowInvoiceForm(true);
        }
      } catch (error) {

      }
    }
  }, []);

  const fetchInvoices = async (page = 1) => {
    try {
      setLoading(true);
      // Add pagination parameters to the API call
      const response = await fetch(`/api/quotes?page=${page}&limit=${itemsPerPage}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      
      const data = await response.json();
      
      // Update pagination state
      if (data.pagination) {
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.totalCount);
      }
      
      // Map database fields to component fields
      const mappedQuotes = (data.quotes || []).map((quote: any) => ({
        ...quote,
        id: quote.id,
        invoiceNumber: quote.quote_number,
        date: quote.created_at, // Map created_at to date field
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
        quote_number: quote.quote_number // Keep this for reference
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
  const [currentInvoice, setCurrentInvoice] = useState<any>({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    items: [] as any[],
    notes: '',
    taxRate: INVOICE_DEFAULTS.taxRate, // GST from config
    status: 'quote',
    paymentMethod: '',
    paidAt: '',
    deliveryAccess: '',
    deliveryDate: '',
    deliveryDateOption: 'specific',
    needsBase: undefined,
    floorType: ''
  });
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  // Sidebar state removed - handled by Sidebar component
  const [currentView, setCurrentView] = useState('invoices');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Auto-focus on newly added item
  useEffect(() => {
    if (currentInvoice.items.length > 0) {
      const lastIndex = currentInvoice.items.length - 1;
      if (inputRefs.current[lastIndex]) {
        inputRefs.current[lastIndex]?.focus();
      }
    }
  }, [currentInvoice.items.length]);

  const addItem = () => {
    const newItems = [...currentInvoice.items, { 
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sku: '', 
      name: '', 
      quantity: 1, 
      price: 0 
    }];
    setCurrentInvoice({
      ...currentInvoice,
      items: newItems
    });
    // Set up for showing product search on the new item
    setActiveItemIndex(newItems.length - 1);
    setShowProductSearch(true);
    setProductSearch('');
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...currentInvoice.items];
    newItems[index][field] = value;
    setCurrentInvoice({ ...currentInvoice, items: newItems });
  };

  const selectProduct = (product: any, index: number) => {
    const newItems = [...currentInvoice.items];
    newItems[index] = {
      id: newItems[index].id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sku: product.sku,
      name: product.name,
      quantity: 1,
      price: product.price
    };
    setCurrentInvoice({ ...currentInvoice, items: newItems });
    setShowProductSearch(false);
    setProductSearch('');
  };

  const removeItem = (index: number) => {
    const newItems = currentInvoice.items.filter((_: any, i: number) => i !== index);
    setCurrentInvoice({ ...currentInvoice, items: newItems });
  };

  // Helper functions using imported utilities
  const getSubtotal = () => calculateSubtotal(currentInvoice.items);
  const getTotal = () => calculateTotal(currentInvoice.items);
  const getGSTComponent = () => calculateGSTComponent(getTotal());
  const getExGST = () => calculateExGST(getTotal());

  const saveInvoice = async () => {
    // Validate email before saving
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!currentInvoice.customerEmail || !emailRegex.test(currentInvoice.customerEmail)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    try {
      const invoiceData = {
        ...currentInvoice,
        invoiceNumber: currentInvoice.invoiceNumber || generateInvoiceNumber(),
        subtotal: getSubtotal(),
        gst: getGSTComponent(),
        total: getTotal()
      };

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
      
      if (result.success) {
        // Sync to Google Sheets
        showToast('Syncing to Google Sheets...', 'info');
        setSyncStatus('syncing');
        
        try {
          const syncResponse = await fetch('/api/sync-sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'sync-single',
              invoice: result.quote || invoiceData
            }),
          });
          
          const syncResult = await syncResponse.json();
          setSyncStatus(syncResult.success ? 'success' : 'error');
          
          if (syncResult.success) {
            showToast('Invoice saved and synced to Google Sheets!', 'success');
          } else {
            showToast('Invoice saved but Google Sheets sync failed', 'error');
          }
        } catch (error) {
          setSyncStatus('error');
          showToast('Invoice saved but Google Sheets sync failed', 'error');
        }
        
        // Refresh the invoices list
        await fetchInvoices(currentPage);
        resetForm();
      } else {
        throw new Error(result.error || 'Failed to save invoice');
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      showToast('Failed to save invoice. Please try again.', 'error', 5000);
    }
  };

  const resetForm = () => {
    setCurrentInvoice({
      invoiceNumber: '',
      date: new Date().toISOString().split('T')[0],
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      items: [],
      notes: '',
      taxRate: 10,
      status: 'quote',
      paymentMethod: '',
      paidAt: '',
      deliveryAccess: '',
      deliveryDate: '',
      deliveryDateOption: 'specific',
      needsBase: undefined,
      floorType: ''
    });
    setShowInvoiceForm(false);
    setPreviewMode(false);
    setCurrentView('invoices');
  };

  const filteredProducts = allProducts.filter(product => {
    const searchLower = productSearch.toLowerCase();
    return product.sku.toLowerCase().includes(searchLower) ||
           product.name.toLowerCase().includes(searchLower);
  });

  const getTotalRevenue = () => {
    return invoices.reduce((sum: number, invoice: any) => sum + invoice.total, 0);
  };

  const handleNavigation = (view: string) => {
    setCurrentView(view);
    setShowInvoiceForm(false);
    setPreviewMode(false);
    setShowPaymentForm(false);
  };

  const handleCreateNewInvoice = () => {
    // Reset invoice to empty state when creating a new invoice
    setCurrentInvoice({
      invoiceNumber: '',
      date: new Date().toISOString().split('T')[0],
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      items: [],
      notes: '',
      taxRate: GST_RATE,
      status: 'quote',
      deliveryAccess: '',
      deliveryDate: '',
      deliveryDateOption: 'specific',
      needsBase: undefined,
      floorType: '',
      total: 0,
      subtotal: 0,
      gst: 0
    });
    // Switch to Quick Invoice view for new invoices
    setCurrentView('quick-invoice');
    setShowInvoiceForm(false);
    setPreviewMode(false);
    setShowPaymentForm(false);
  };

  const handlePayment = (invoice: any) => {
    setShowPaymentForm(true);
    setCurrentView('payment');
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setPreviewMode(false);
    setCurrentView('invoices');
    showToast('Payment successful! Thank you for your purchase.', 'success');
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setPreviewMode(true);
    setCurrentView('preview');
  };

  const handleViewInvoice = (invoice: any) => {
    // Map the invoice data properly
    const mappedInvoice = {
      ...invoice,
      invoiceNumber: invoice.quote_number || invoice.invoiceNumber,
      customerName: invoice.customer_name || invoice.customerName,
      customerEmail: invoice.customer_email || invoice.customerEmail,
      customerPhone: invoice.customer_phone || invoice.customerPhone,
      customerAddress: invoice.customer_address || invoice.customerAddress,
      deliveryAccess: invoice.delivery_access || invoice.deliveryAccess,
      items: invoice.items || [],
      notes: invoice.notes || '',
      status: invoice.status || 'quote',
      paymentStatus: invoice.payment_status || invoice.paymentStatus,
      paymentMethod: invoice.payment_method || invoice.paymentMethod,
      paidAt: invoice.paid_at || invoice.paidAt,
      total: parseFloat(invoice.total) || 0,
      subtotal: parseFloat(invoice.subtotal) || 0,
      gst: parseFloat(invoice.gst) || 0,
      quote_number: invoice.quote_number
    };
    
    setCurrentInvoice(mappedInvoice);
    setPreviewMode(true);
    setCurrentView('preview');
  };

  const handleSendQuote = (invoice: any) => {
    setEmailRecipient(invoice.customerEmail || '');
    setEmailMessage('');
    setShowEmailModal(true);
  };

  const sendQuoteEmail = async () => {
    if (!emailRecipient) {
      showToast('Please enter recipient email', 'error');
      return;
    }

    setEmailSending(true);
    try {
      const response = await fetch('/api/send-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice: currentInvoice,
          recipientEmail: emailRecipient,
          message: emailMessage,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Quote sent successfully!', 'success');
        setShowEmailModal(false);
        setEmailRecipient('');
        setEmailMessage('');
      } else {
        showToast(`Error: ${result.error}`, 'error', 5000);
      }
    } catch (error) {
      console.error('Error sending quote:', error);
      showToast('Failed to send quote. Please try again.', 'error', 5000);
    } finally {
      setEmailSending(false);
    }
  };

  const handleMarkAsPaid = () => {
    setSelectedPaymentMethod('');
    setShowPaymentModal(true);
  };

  const confirmMarkAsPaid = async () => {
    if (!selectedPaymentMethod) {
      showToast('Please select a payment method', 'error');
      return;
    }

    try {
      const updatedInvoice = {
        ...currentInvoice,
        status: 'paid',
        paymentMethod: selectedPaymentMethod,
        paidAt: new Date().toISOString()
      };

      // If it's a new invoice that hasn't been saved yet, save it first
      if (!currentInvoice.quote_number) {
        const invoiceData = {
          ...updatedInvoice,
          invoiceNumber: updatedInvoice.invoiceNumber || generateInvoiceNumber(),
          subtotal: getSubtotal(),
          gst: getGSTComponent(),
          total: getTotal()
        };

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
        if (result.success && result.quote) {
          updatedInvoice.quote_number = result.quote.quote_number;
        }
      } else {
        // Update existing invoice status
        const response = await fetch(`/api/quotes/${currentInvoice.quote_number}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'paid',
            paymentStatus: 'paid'
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update invoice status');
        }
      }

      // Update current invoice
      setCurrentInvoice(updatedInvoice);
      
      // Refresh the invoices list
      await fetchInvoices(currentPage);
      
      setShowPaymentModal(false);
      showToast('Invoice marked as paid successfully!', 'success');
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      showToast('Failed to mark invoice as paid. Please try again.', 'error', 5000);
    }
  };


  // Checkbox selection handlers
  const toggleInvoiceSelection = (quoteNumber: string) => {
    const newSelection = new Set(selectedInvoices);
    if (newSelection.has(quoteNumber)) {
      newSelection.delete(quoteNumber);
    } else {
      newSelection.add(quoteNumber);
    }
    setSelectedInvoices(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedInvoices.size === invoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(invoices.map(inv => inv.quote_number)));
    }
  };

  const handleBulkDelete = async (quoteNumbers?: string[]) => {
    const toDelete = quoteNumbers || Array.from(selectedInvoices);
    if (toDelete.length === 0) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch('/api/quotes/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quoteNumbers: toDelete
        })
      });

      const result = await response.json();

      if (result.success) {
        // Refresh the invoices list
        await fetchInvoices(currentPage);
        // Clear selection
        setSelectedInvoices(new Set());
        setShowDeleteConfirm(false);
        showToast(`Successfully deleted ${result.deletedCount} invoice(s)`, 'success');
        return result;
      } else {
        throw new Error(result.error || 'Failed to delete invoices');
      }
    } catch (error) {
      console.error('Error deleting invoices:', error);
      showToast('Failed to delete invoices. Please try again.', 'error', 5000);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  const clearSelection = () => {
    setSelectedInvoices(new Set());
  };

  // Check if invoice has Cloud or Aurora King/Queen mattresses that need labels
  const hasLabelProducts = (invoice: any) => {
    return invoice.items.some((item: any) => {
      if (!item.sku) return false;
      const skuLower = item.sku.toLowerCase();
      
      // Check if it's Cloud or Aurora
      const isCloudOrAurora = skuLower.startsWith('cloud') || skuLower.startsWith('aurora');
      
      // Check if it's King or Queen size
      const isKingOrQueen = skuLower.includes('king') || skuLower.includes('queen');
      
      return isCloudOrAurora && isKingOrQueen;
    });
  };

  // Get label items for printing
  const getLabelItems = (invoice: any) => {
    return invoice.items.filter((item: any) => {
      if (!item.sku) return false;
      const skuLower = item.sku.toLowerCase();
      const isCloudOrAurora = skuLower.startsWith('cloud') || skuLower.startsWith('aurora');
      const isKingOrQueen = skuLower.includes('king') || skuLower.includes('queen');
      return isCloudOrAurora && isKingOrQueen;
    }).flatMap((item: any) => {
      // Extract range and model from SKU
      const skuLower = item.sku.toLowerCase();
      let range = '';
      let model = 0;
      let size = '';
      
      // Parse range
      if (skuLower.startsWith('cloud')) {
        range = 'Cloud';
        // Extract model number after 'cloud'
        const modelMatch = item.sku.match(/cloud(\d+)/i);
        if (modelMatch) {
          model = parseInt(modelMatch[1]);
        }
      } else if (skuLower.startsWith('aurora')) {
        range = 'Aurora';
        // Extract model number after 'aurora'
        const modelMatch = item.sku.match(/aurora(\d+)/i);
        if (modelMatch) {
          model = parseInt(modelMatch[1]);
        }
      }
      
      // Parse size from SKU
      if (skuLower.includes('king') && !skuLower.includes('kingsingle')) {
        size = 'King';
      } else if (skuLower.includes('queen')) {
        size = 'Queen';
      }
      
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

  const handlePrintLabels = (invoice: any) => {
    const labelItems = getLabelItems(invoice);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print labels');
      return;
    }
    
    // Create the HTML for the labels
    const labelHtml = labelItems.map((item: any) => {
      const firstName = item.customerName.split(' ')[0];
      const addressLines = item.customerAddress.split('\n');
      const lastLine = addressLines[addressLines.length - 1].trim();
      
      // Extract suburb from address
      let suburb = lastLine;
      const match = lastLine.match(/^(.+?)\s+[A-Z]{2,3}\s+\d{4}$/);
      if (match) {
        suburb = match[1].trim();
      }
      
      // Define layer configurations for different models
      const getLayersForModel = (range: string, model: number) => {
        // Find the layer configuration from the data file
        const rangeLower = range.toLowerCase();
        const layerData = mattressLayers.find(
          layer => layer.model === rangeLower && layer.firmness === model
        );
        
        if (!layerData) {
          return null;
        }
        
        // Build the visual layers array
        const layers = [];
        const colorMap: { [key: string]: string } = {
          'soft latex': '#fef3c7', // yellow
          'medium latex': '#ffd29d', // orange-yellow
          'firm latex': '#ffb366', // orange
          'micro': '#d1fae5', // green
          'micros': '#d1fae5', // green
          'felt': '#e5e7eb', // gray
          'white': '#f9fafb', // light gray
          'purple': '#e9d5ff', // purple
          'blue': '#dbeafe', // blue
          '-': 'transparent' // skip empty layers
        };
        
        // Add top layers (layer5 to layer2)
        if (layerData.layer5 && layerData.layer5 !== '-') {
          layers.push({ text: layerData.layer5, color: colorMap[layerData.layer5] || '#ffffff' });
        }
        if (layerData.layer4 && layerData.layer4 !== '-') {
          layers.push({ text: layerData.layer4, color: colorMap[layerData.layer4] || '#ffffff' });
        }
        if (layerData.layer3 && layerData.layer3 !== '-') {
          layers.push({ text: layerData.layer3, color: colorMap[layerData.layer3] || '#ffffff' });
        }
        if (layerData.layer2 && layerData.layer2 !== '-') {
          layers.push({ text: layerData.layer2, color: colorMap[layerData.layer2] || '#ffffff' });
        }
        
        // Add spring layers
        layers.push({ 
          text: layerData.springsPosition, 
          color: '#ffffff', 
          border: '1px solid #e5e7eb' 
        });
        layers.push({ 
          text: layerData.mainSpringLayer, 
          color: '#ffffff', 
          border: '1px solid #e5e7eb' 
        });
        
        // Add under-spring layers
        if (layerData.underSprings1 && layerData.underSprings1 !== '-') {
          layers.push({ text: layerData.underSprings1, color: colorMap[layerData.underSprings1] || '#ffffff' });
        }
        if (layerData.underSprings2 && layerData.underSprings2 !== '-') {
          layers.push({ text: layerData.underSprings2, color: colorMap[layerData.underSprings2] || '#ffffff' });
        }
        if (layerData.underSprings3 && layerData.underSprings3 !== '-') {
          layers.push({ text: layerData.underSprings3, color: colorMap[layerData.underSprings3] || '#ffffff' });
        }
        
        // Build components string
        const components = [];
        if (layerData.layer5 && layerData.layer5 !== '-') components.push(layerData.layer5.toUpperCase());
        if (layerData.layer4 && layerData.layer4 !== '-') components.push(layerData.layer4.toUpperCase());
        if (layerData.layer3 && layerData.layer3 !== '-') components.push(layerData.layer3.toUpperCase());
        if (layerData.layer2 && layerData.layer2 !== '-') components.push(layerData.layer2.toUpperCase());
        
        return {
          components: components.join(' + '),
          layers: layers
        };
      };
      
      const modelConfig = getLayersForModel(item.range, item.model);
      
      // Single page with side-by-side layout
      return `
        <div style="page-break-after: always; width: 100%; height: 100vh; display: flex; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: white;">
          <!-- Left Half - Product Label -->
          <div style="width: 50%; display: flex; justify-content: center; align-items: center; position: relative;">
            <div style="text-align: center; padding: 2rem;">
              <!-- Brand name - small like Nike logo -->
              <div style="font-size: 14px; font-weight: 600; letter-spacing: 2px; margin-bottom: 3rem;">
                ausbeds
              </div>
              
              <!-- Product Name - Large Nike-style text -->
              <div style="margin-bottom: 2rem;">
                <div style="font-size: 64px; font-weight: 900; line-height: 0.85; letter-spacing: -2px; margin-bottom: 0.2rem;">
                  ${item.range.toUpperCase()} ${item.model}
                </div>
                <div style="font-size: 56px; font-weight: 900; line-height: 0.9; letter-spacing: -2px;">
                  ${item.size.toUpperCase()}
                </div>
              </div>
              
              <!-- Customer Info - Bold but smaller -->
              <div style="margin-top: 3rem;">
                <div style="font-size: 36px; font-weight: 800; letter-spacing: -1px; margin-bottom: 0.5rem;">
                  ${firstName.toUpperCase()}
                </div>
                <div style="font-size: 28px; font-weight: 700; letter-spacing: 0px;">
                  ${suburb.toUpperCase()}
                </div>
              </div>
              
              <!-- Components -->
              ${modelConfig ? `
                <div style="margin-top: 3rem;">
                  <div style="border: 3px solid black; display: inline-block; padding: 1.5rem 2.5rem;">
                    <div style="font-size: 24px; font-weight: 800; letter-spacing: 1px;">
                      ${modelConfig.components}
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Vertical Cut Line -->
          <div style="width: 2px; background: repeating-linear-gradient(to bottom, #ccc 0, #ccc 10px, transparent 10px, transparent 20px); margin: 2rem 0;"></div>
          
          <!-- Right Half - Layer Diagram -->
          <div style="width: 50%; display: flex; justify-content: center; align-items: center;">
            ${modelConfig ? `
              <div style="width: 80%; max-width: 400px;">
                <!-- Product identifier at top -->
                <div style="text-align: center; margin-bottom: 2rem;">
                  <div style="font-size: 32px; font-weight: 900; letter-spacing: -1px; line-height: 1.2;">
                    ${item.range.toLowerCase()} ${item.model} ${item.size.toLowerCase()}
                  </div>
                  <div style="font-size: 26px; font-weight: 800; letter-spacing: 0px; margin-top: 0.5rem;">
                    ${firstName.toLowerCase()} • ${suburb.toLowerCase()}
                  </div>
                </div>
                
                <!-- Layer blocks -->
                <div style="display: flex; flex-direction: column; gap: 0; border: 2px solid #000;">
                  ${modelConfig.layers.map((layer: any) => `
                    <div style="
                      background-color: ${layer.color};
                      ${layer.border || ''};
                      padding: 1rem;
                      text-align: center;
                      font-size: 24px;
                      font-weight: 700;
                      color: #000;
                      min-height: 55px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    ">
                      ${layer.text}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : `
              <div style="text-align: center; color: #999;">
                <div style="font-size: 24px;">Layer diagram not available</div>
                <div style="font-size: 18px; margin-top: 1rem;">for ${item.range} ${item.model}</div>
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');
    
    // Write the HTML to the print window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Production Labels</title>
          <style>
            @media print {
              body { 
                margin: 0;
                background: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              @page {
                margin: 0;
                size: A4 landscape;
                orientation: landscape;
              }
            }
            * {
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0;">
          ${labelHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAFA] to-[#F5F5F5]">
      {/* Sidebar Component - Always floating */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={handleNavigation}
        onQuickInvoice={handleCreateNewInvoice}
      />

      {/* Main Content - Add left margin to account for fixed sidebar */}
      <div className="lg:ml-64 p-6 print:p-0 print:w-full">

        {/* All Invoices View */}
        {currentView === 'invoices' && !showInvoiceForm && !previewMode && (
          <InvoiceList
            title="All Invoices"
            invoices={invoices}
            onCreateNewInvoice={handleCreateNewInvoice}
            onSelectInvoice={(invoice) => {
              setCurrentInvoice(invoice);
              setPreviewMode(true);
              setCurrentView('preview');
            }}
            onDeleteInvoices={handleBulkDelete}
            onSyncToSheets={async () => {
              setSyncStatus('syncing');
              showToast('Syncing all invoices to Google Sheets...', 'info');
              
              try {
                const syncResponse = await fetch('/api/sync-sheets', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'sync-all',
                    invoices: invoices
                  }),
                });
                
                const result = await syncResponse.json();
                setSyncStatus(result.success ? 'success' : 'error');
                
                if (result.success) {
                  showToast(`Synced ${result.syncedCount} invoices to Google Sheets!`, 'success');
                } else {
                  showToast('Failed to sync to Google Sheets', 'error');
                }
              } catch (error) {
                setSyncStatus('error');
                showToast('Failed to sync to Google Sheets', 'error');
              }
            }}
            syncStatus={syncStatus}
            showToast={showToast}
          />
        )}

        {/* Paid Invoices View (separate from All Invoices) */}
        {currentView === 'paid-invoices' && !showInvoiceForm && !previewMode && (
          <PaidInvoicesView
            invoices={invoices}
            onCreateNewInvoice={handleCreateNewInvoice}
            onSelectInvoice={(invoice) => {
              setCurrentInvoice(invoice);
              setPreviewMode(true);
              setCurrentView('preview');
            }}
            onDeleteInvoices={handleBulkDelete}
            onSyncToSheets={async () => {
              setSyncStatus('syncing');
              showToast('Syncing all invoices to Google Sheets...', 'info');
              
              try {
                const syncResponse = await fetch('/api/sync-sheets', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'sync-all',
                    invoices: invoices
                  })
                });

                if (!syncResponse.ok) {
                  throw new Error('Failed to sync to Google Sheets');
                } else {
                  setSyncStatus('success');
                  showToast('Successfully synced to Google Sheets!', 'success');
                }
              } catch (error) {
                setSyncStatus('error');
                showToast('Failed to sync to Google Sheets', 'error');
              }
            }}
            syncStatus={syncStatus}
            showToast={showToast}
          />
        )}



        {/* Quick Invoice View - Ordered Form */}
        {currentView === 'quick-invoice' && !showInvoiceForm && !previewMode && (
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <InvoiceFormOrdered
              invoice={currentInvoice}
              onChange={setCurrentInvoice}
              onSave={async () => {
                try {
                  const invoiceNumber = await getNextSequentialInvoiceNumber();
                  const response = await fetch('/api/quotes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ...currentInvoice,
                      quoteNumber: invoiceNumber,
                      invoiceNumber: invoiceNumber,
                      status: 'sent',
                      subtotal: currentInvoice.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0),
                      gst: Number(currentInvoice.total) / 11,
                      total: Number(currentInvoice.total)
                    })
                  });

                  if (response.ok) {
                    showToast(`Invoice ${invoiceNumber} created successfully!`, 'success');
                    setCurrentView('invoices');
                    fetchInvoices(currentPage);
                  }
                } catch (error) {
                  console.error('Error saving invoice:', error);
                  showToast('Failed to save invoice', 'error');
                }
              }}
              onSaveDraft={async () => {
                try {
                  const invoiceNumber = await getNextSequentialInvoiceNumber();
                  const response = await fetch('/api/quotes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ...currentInvoice,
                      quoteNumber: invoiceNumber,
                      invoiceNumber: invoiceNumber,
                      status: 'draft',
                      subtotal: currentInvoice.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0),
                      gst: Number(currentInvoice.total) / 11,
                      total: Number(currentInvoice.total)
                    })
                  });

                  if (response.ok) {
                    showToast(`Draft ${invoiceNumber} saved successfully!`, 'success');
                    fetchInvoices(currentPage);
                  }
                } catch (error) {
                  console.error('Error saving draft:', error);
                  showToast('Failed to save draft', 'error');
                }
              }}
              onPayNow={async () => {
                try {
                  const invoiceNumber = await getNextSequentialInvoiceNumber();
                  const response = await fetch('/api/quotes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ...currentInvoice,
                      quoteNumber: invoiceNumber,
                      invoiceNumber: invoiceNumber,
                      status: 'sent',
                      subtotal: currentInvoice.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0),
                      gst: Number(currentInvoice.total) / 11,
                      total: Number(currentInvoice.total)
                    })
                  });

                  if (response.ok) {
                    const result = await response.json();
                    const quoteId = result.quote?.quote_number || invoiceNumber;
                    window.location.href = `/checkout/${quoteId}`;
                  }
                } catch (error) {
                  console.error('Error creating invoice for payment:', error);
                  showToast('Failed to create invoice', 'error');
                }
              }}
            />
          </div>
        )}

        {/* Products View */}
        {currentView === 'products' && !showInvoiceForm && !previewMode && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Product Catalog</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">SKU</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Product Name</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Range</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Size</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Firmness</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Price (Inc. GST)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allProducts.map((product) => (
                    <tr key={product.sku} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm text-gray-600">{product.sku}</td>
                      <td className="py-3 px-4 text-gray-900">{product.name}</td>
                      <td className="py-3 px-4 text-gray-600">{product.range}</td>
                      <td className="py-3 px-4 text-gray-600">{product.size}</td>
                      <td className="py-3 px-4 text-gray-600">{product.firmness}</td>
                      <td className="text-right py-3 px-4 font-semibold text-gray-900">${product.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* GORDON'S PAGINATION CONTROLS - Navigate through your invoices properly! */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} invoices
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentPage(1);
                      fetchInvoices(1);
                    }}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => {
                      const newPage = currentPage - 1;
                      setCurrentPage(newPage);
                      fetchInvoices(newPage);
                    }}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => {
                      const newPage = currentPage + 1;
                      setCurrentPage(newPage);
                      fetchInvoices(newPage);
                    }}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage(totalPages);
                      fetchInvoices(totalPages);
                    }}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </div>
        )}



        {/* New Invoice Form */}
        {showInvoiceForm && !previewMode && (
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">Create New Invoice</h2>
            
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                  <input
                    type="text"
                    placeholder="John Smith"
                    value={currentInvoice.customerName}
                    onChange={(e) => setCurrentInvoice({...currentInvoice, customerName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5E5FF] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={currentInvoice.customerEmail}
                    onChange={(e) => setCurrentInvoice({...currentInvoice, customerEmail: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5E5FF] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    placeholder="0412 345 678"
                    value={currentInvoice.customerPhone}
                    onChange={(e) => setCurrentInvoice({...currentInvoice, customerPhone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5E5FF] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    placeholder="123 Main St, Sydney NSW 2000"
                    value={currentInvoice.customerAddress}
                    onChange={(e) => setCurrentInvoice({...currentInvoice, customerAddress: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5E5FF] focus:border-transparent transition-all resize-none"
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Access</label>
                  <select
                    value={currentInvoice.deliveryAccess}
                    onChange={(e) => setCurrentInvoice({...currentInvoice, deliveryAccess: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5E5FF] focus:border-transparent transition-all appearance-none bg-white"
                  >
                    <option value="">Select delivery access...</option>
                    <option value="Ground floor">Ground floor</option>
                    <option value="Lift access">Lift access</option>
                    <option value="Few steps">Few steps</option>
                    <option value="1 flight of stairs">1 flight of stairs</option>
                    <option value="2 flights of stairs">2 flights of stairs</option>
                    <option value="3 flights of stairs">3 flights of stairs</option>
                    <option value="4+ flights of stairs">4+ flights of stairs</option>
                    <option value="Stairs no help">Stairs no help (+$50)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Line Items</h3>
              <div className="space-y-4">
                {currentInvoice.items.map((item: any, index: number) => (
                  <div key={item.id || `item_${index}`} className="relative">
                    <div className="flex gap-4 items-start">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                        <div className="relative">
                          <input
                            ref={(el) => {inputRefs.current[index] = el}}
                            type="text"
                            placeholder="Search products..."
                            value={item.name}
                            onChange={(e) => {
                              updateItem(index, 'name', e.target.value);
                              setProductSearch(e.target.value);
                              setActiveItemIndex(index);
                              setShowProductSearch(true);
                            }}
                            onFocus={() => {
                              setActiveItemIndex(index);
                              setShowProductSearch(true);
                              setProductSearch(item.name);
                            }}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5E5FF] focus:border-transparent transition-all"
                          />
                          {showProductSearch && activeItemIndex === index && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                              {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                  <button
                                    key={product.sku}
                                    onClick={() => selectProduct(product, index)}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="font-medium text-gray-900">{product.name}</div>
                                    <div className="text-sm text-gray-600">SKU: {product.sku} - ${product.price}</div>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-gray-500">No products found</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="w-24">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5E5FF] focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5E5FF] focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total</label>
                        <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                          ${(item.quantity * item.price).toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(index)}
                        className="mt-8 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addItem}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Item
                </button>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                placeholder="Add any additional notes..."
                value={currentInvoice.notes}
                onChange={(e) => setCurrentInvoice({...currentInvoice, notes: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5E5FF] focus:border-transparent transition-all resize-none"
                rows={4}
              />
            </div>

            <div className="bg-[#F5F5FF] rounded-xl p-6 mb-8">
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-medium">${getSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>GST (10%)</span>
                  <span className="font-medium">${getGSTComponent().toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-gray-300">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>${getTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setPreviewMode(true)}
                className="flex-1 bg-[#E5E5FF] text-gray-900 px-6 py-3 rounded-xl hover:bg-[#D5D5FF] font-medium transition-colors"
              >
                Preview Invoice
              </button>
              <button
                onClick={saveInvoice}
                className="flex-1 bg-[#E5FFE5] text-gray-900 px-6 py-3 rounded-xl hover:bg-[#D5FFD5] font-medium transition-colors"
              >
                Save Invoice
              </button>
            </div>
          </div>
        )}

        {/* Preview Mode */}
        {previewMode && !showPaymentForm && (
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Invoice Preview</h2>
              <button
                onClick={() => setPreviewMode(false)}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <InvoicePreview 
              invoice={currentInvoice}
              deliveryAccess={currentInvoice.deliveryAccess}
            />
            
            {/* Action Buttons Bar - Prominent after save */}
            <div className="mt-8 print:hidden">
              {/* Primary Actions */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">What would you like to do next?</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => {
                      setPreviewMode(false);
                      setShowInvoiceForm(true);
                    }}
                    className="px-4 py-3 bg-white text-gray-900 rounded-xl hover:bg-purple-50 font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 border border-purple-200"
                  >
                    <Edit2 className="w-5 h-5" />
                    Edit Invoice
                  </button>
                  
                  <button
                    onClick={() => handleSendQuote(currentInvoice)}
                    className="px-4 py-3 bg-white text-gray-900 rounded-xl hover:bg-blue-50 font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 border border-blue-200"
                  >
                    <Mail className="w-5 h-5" />
                    Send to Customer
                  </button>
                  
                  <button
                    onClick={() => {
                      const checkoutUrl = `/checkout/${currentInvoice.id || currentInvoice.quote_number}`;
                      navigator.clipboard.writeText(window.location.origin + checkoutUrl);
                      showToast('Payment link copied to clipboard!', 'success');
                    }}
                    className="px-4 py-3 bg-white text-gray-900 rounded-xl hover:bg-green-50 font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 border border-green-200"
                  >
                    <Link className="w-5 h-5" />
                    Copy Payment Link
                  </button>
                  
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 border border-gray-200"
                  >
                    <Download className="w-5 h-5" />
                    Print/PDF
                  </button>
                </div>
              </div>
              
              {/* Secondary Actions */}
              <div className="flex gap-3 justify-center">
                {hasLabelProducts(currentInvoice) && (
                  <button
                    onClick={() => handlePrintLabels(currentInvoice)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors flex items-center gap-2 text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    Print Labels
                  </button>
                )}
                
                {currentInvoice.status !== 'paid' && (
                  <>
                    <button
                      onClick={handleMarkAsPaid}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition-colors flex items-center gap-2 text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Paid
                    </button>
                    
                    <button
                      onClick={() => handlePayment(currentInvoice)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium transition-colors flex items-center gap-2 text-sm"
                    >
                      <CreditCard className="w-4 h-4" />
                      Process Payment
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Form */}
        {showPaymentForm && (
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <PaymentForm
              invoice={currentInvoice}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </div>
        )}

        {/* Email Modal */}
        <EmailModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          recipientEmail={emailRecipient}
          onRecipientEmailChange={setEmailRecipient}
          message={emailMessage}
          onMessageChange={setEmailMessage}
          onSend={sendQuoteEmail}
          isSending={emailSending}
        />

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          selectedPaymentMethod={selectedPaymentMethod}
          onPaymentMethodChange={setSelectedPaymentMethod}
          onConfirm={confirmMarkAsPaid}
          customerName={currentInvoice.customerName}
          total={getTotal()}
          invoiceNumber={currentInvoice.invoiceNumber}
        />
      </div>
      
      {/* Toast Notifications */}
      <Toast messages={toastMessages} removeToast={removeToast} />
    </div>
  );
};

export default MattressInvoiceApp;
