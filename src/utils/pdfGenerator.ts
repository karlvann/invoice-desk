import jsPDF from 'jspdf';
import { mattressLayers } from '../data/mattressLayers';
import { BUSINESS_INFO } from '../config/business';
import { formatDate } from './invoice';

export function generateInvoicePDF(invoice: any) {
  const doc = new jsPDF();
  let yPos = 20;
  
  // Header
  doc.setFontSize(20);
  doc.text('AUSBEDS', 105, yPos, { align: 'center' });
  yPos += 10;
  
  doc.setFontSize(12);
  doc.text('INVOICE', 105, yPos, { align: 'center' });
  yPos += 15;
  
  // Invoice details
  doc.setFontSize(10);
  doc.text(`Invoice #: ${invoice.invoiceNumber || 'DRAFT'}`, 20, yPos);
  doc.text(`Date: ${formatDate(invoice.date)}`, 120, yPos);
  yPos += 7;
  
  doc.text(`Payment Status: ${invoice.paymentStatus || invoice.payment_status || 'Pending'}`, 20, yPos);
  yPos += 15;
  
  // Customer details
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Bill To:', 20, yPos);
  doc.setFont(undefined, 'normal');
  yPos += 7;
  
  doc.setFontSize(10);
  doc.text(invoice.customerName || invoice.customer_name, 20, yPos);
  yPos += 5;
  doc.text(invoice.customerEmail || invoice.customer_email, 20, yPos);
  yPos += 5;
  doc.text(invoice.customerPhone || invoice.customer_phone, 20, yPos);
  yPos += 5;
  
  const address = invoice.customerAddress || invoice.customer_address || '';
  const addressLines = address.split('\n');
  addressLines.forEach((line: string) => {
    doc.text(line, 20, yPos);
    yPos += 5;
  });
  yPos += 10;
  
  // Items header
  doc.setFont(undefined, 'bold');
  doc.text('Item', 20, yPos);
  doc.text('Qty', 140, yPos);
  doc.text('Price', 160, yPos);
  doc.text('Total', 180, yPos);
  yPos += 7;
  
  // Line
  doc.line(20, yPos - 2, 190, yPos - 2);
  doc.setFont(undefined, 'normal');
  
  // Items
  invoice.items.forEach((item: any) => {
    // Item name and SKU
    doc.text(item.name || item.description, 20, yPos);
    doc.text(String(item.quantity), 140, yPos);
    doc.text(`$${parseFloat(item.price).toFixed(2)}`, 160, yPos);
    doc.text(`$${(item.quantity * parseFloat(item.price)).toFixed(2)}`, 180, yPos);
    yPos += 6;
    
    // Add layer data if it's a mattress with firmness
    if (item.sku) {
      const layerInfo = extractLayerInfo(item);
      if (layerInfo) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`  Firmness: ${layerInfo.firmness} | Spring: ${layerInfo.mainSpringLayer}`, 20, yPos);
        yPos += 4;
        
        // Show top layers if they exist
        const topLayers = [];
        if (layerInfo.layer5 && layerInfo.layer5 !== '-') topLayers.push(layerInfo.layer5);
        if (layerInfo.layer4 && layerInfo.layer4 !== '-') topLayers.push(layerInfo.layer4);
        if (layerInfo.layer3 && layerInfo.layer3 !== '-') topLayers.push(layerInfo.layer3);
        
        if (topLayers.length > 0) {
          doc.text(`  Layers: ${topLayers.join(', ')}`, 20, yPos);
          yPos += 4;
        }
        
        doc.setTextColor(0);
        doc.setFontSize(10);
      }
    }
    yPos += 2;
  });
  
  // Totals
  yPos += 5;
  doc.line(140, yPos, 190, yPos);
  yPos += 7;
  
  doc.text('Subtotal (ex GST):', 120, yPos);
  doc.text(`$${parseFloat(invoice.subtotal || ((invoice.total || 0) * 10/11)).toFixed(2)}`, 180, yPos, { align: 'right' });
  yPos += 6;
  
  doc.text('GST (10%):', 120, yPos);
  doc.text(`$${parseFloat(invoice.gst || ((invoice.total || 0) / 11)).toFixed(2)}`, 180, yPos, { align: 'right' });
  yPos += 6;
  
  doc.setFont(undefined, 'bold');
  doc.text('Total:', 120, yPos);
  doc.text(`$${parseFloat(invoice.total || 0).toFixed(2)}`, 180, yPos, { align: 'right' });
  doc.setFont(undefined, 'normal');
  
  // Footer
  yPos = 260;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Thank you for your business!', 105, yPos, { align: 'center' });
  yPos += 4;
  doc.text(`ABN: ${BUSINESS_INFO.abn} | ${BUSINESS_INFO.email} | ${BUSINESS_INFO.phone}`, 105, yPos, { align: 'center' });
  
  return doc;
}

function extractLayerInfo(item: any) {
  // Try to extract model and firmness from SKU or name
  const name = (item.name || item.description || '').toLowerCase();
  const sku = (item.sku || '').toLowerCase();
  
  let model = '';
  let firmness = 0;
  
  // Detect model
  if (sku.includes('cloud') || name.includes('cloud')) model = 'cloud';
  else if (sku.includes('aurora') || name.includes('aurora')) model = 'aurora';
  else if (sku.includes('cooper') || name.includes('cooper')) model = 'cooper';
  else return null;
  
  // Try to extract firmness number from name (e.g., "Cloud 7 - King")
  const firmMatch = name.match(/\b(\d+)\b/);
  if (firmMatch) {
    firmness = parseInt(firmMatch[1]);
  }
  
  // Find matching layer data
  const layerData = mattressLayers.find(
    m => m.model === model && m.firmness === firmness
  );
  
  return layerData;
}