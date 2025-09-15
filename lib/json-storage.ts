import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const INVOICES_FILE = path.join(DATA_DIR, 'invoices.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure invoices file exists
if (!fs.existsSync(INVOICES_FILE)) {
  fs.writeFileSync(INVOICES_FILE, '[]');
}

export interface Invoice {
  id: number;
  quote_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  items: any[];
  subtotal: number;
  gst: number;
  total: number;
  status: string;
  payment_status: string;
  stripe_payment_intent_id?: string;
  delivery_access?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  deleted_at?: string;
}

// Read all invoices from JSON file
export function readInvoices(): Invoice[] {
  try {
    const data = fs.readFileSync(INVOICES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading invoices:', error);
    return [];
  }
}

// Write all invoices to JSON file
export function writeInvoices(invoices: Invoice[]): void {
  try {
    fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2));
  } catch (error) {
    console.error('Error writing invoices:', error);
    throw error;
  }
}

// Generate next invoice number
export function generateInvoiceNumber(): string {
  const invoices = readInvoices();
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `INV-${year}${month}-`;
  
  // Find existing invoices with same prefix
  const existingNumbers = invoices
    .filter(inv => inv.quote_number.startsWith(prefix))
    .map(inv => parseInt(inv.quote_number.split('-')[2]))
    .filter(num => !isNaN(num));
  
  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}

// Create new invoice
export function createInvoice(invoiceData: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Invoice {
  const invoices = readInvoices();
  const now = new Date().toISOString();
  
  const newInvoice: Invoice = {
    ...invoiceData,
    id: invoices.length > 0 ? Math.max(...invoices.map(inv => inv.id)) + 1 : 1,
    created_at: now,
    updated_at: now
  };
  
  invoices.push(newInvoice);
  writeInvoices(invoices);
  
  return newInvoice;
}

// Get invoice by quote number
export function getInvoiceByQuoteNumber(quoteNumber: string): Invoice | undefined {
  const invoices = readInvoices();
  return invoices.find(inv => inv.quote_number === quoteNumber && !inv.deleted_at);
}

// Get invoice by ID
export function getInvoiceById(id: number): Invoice | undefined {
  const invoices = readInvoices();
  return invoices.find(inv => inv.id === id && !inv.deleted_at);
}

// Update invoice
export function updateInvoice(quoteNumber: string, updates: Partial<Invoice>): Invoice | null {
  const invoices = readInvoices();
  const index = invoices.findIndex(inv => inv.quote_number === quoteNumber);
  
  if (index === -1) return null;
  
  invoices[index] = {
    ...invoices[index],
    ...updates,
    updated_at: new Date().toISOString()
  };
  
  writeInvoices(invoices);
  return invoices[index];
}

// Get all invoices (non-deleted)
export function getAllInvoices(limit = 50, offset = 0): Invoice[] {
  const invoices = readInvoices();
  const activeInvoices = invoices
    .filter(inv => !inv.deleted_at)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  return activeInvoices.slice(offset, offset + limit);
}

// Soft delete invoice
export function softDeleteInvoice(quoteNumber: string): boolean {
  const invoices = readInvoices();
  const index = invoices.findIndex(inv => inv.quote_number === quoteNumber);
  
  if (index === -1) return false;
  
  invoices[index].deleted_at = new Date().toISOString();
  invoices[index].updated_at = new Date().toISOString();
  
  writeInvoices(invoices);
  return true;
}