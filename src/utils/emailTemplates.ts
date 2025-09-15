/**
 * Email Template Utility
 * Centralized email templates for all transactional emails
 * No more bloody hardcoded HTML scattered everywhere
 */

interface EmailData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  quoteNumber: string;
  total: number;
  gstAmount?: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
  paymentLink?: string;
  message?: string;
  deliveryDate?: string;
  deliveryWindow?: string;
  hasStairs?: boolean;
  twoPersonDelivery?: boolean;
  removeOldMattress?: boolean;
  deliveryInstructions?: string;
}

/**
 * Get plain text email content based on template type
 * Clean, simple, no-nonsense - like Karl's actual emails
 */
export function getPlainTextEmail(templateId: string, data: EmailData): string {
  switch(templateId) {
    case 'quote':
      const deliveryOptions = [];
      if (data.deliveryDate) deliveryOptions.push(`Delivery: ${data.deliveryDate}, ${data.deliveryWindow}`);
      if (data.hasStairs) deliveryOptions.push('Stairs: Yes (2 person delivery)');
      if (data.removeOldMattress) deliveryOptions.push('Old mattress removal: Yes');
      
      return `${data.customerName}, your ${data.items[0]?.name || 'mattress'} is ready to order.

${data.paymentLink}

${deliveryOptions.length > 0 ? `What you selected:
${data.items.map(item => `- ${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`).join('\n')}
${deliveryOptions.map(opt => `- ${opt}`).join('\n')}

` : ''}Total: $${data.total.toFixed(2)}

${data.message ? `${data.message}

` : ''}Karl
0450 606 589`;

    case 'payment-received':
      return `Got your payment ${data.customerName}.

I'll call you within 48 hours to lock in delivery.

Order: #${data.quoteNumber}
Amount paid: $${data.total.toFixed(2)}

Karl
0450 606 589`;

    case 'delivery-schedule':
      return `Locked in for ${data.deliveryDate}, ${data.deliveryWindow}.

Driver will call when 30 mins away.
${data.deliveryInstructions ? `We've got your instructions: ${data.deliveryInstructions}` : ''}

Karl
0450 606 589`;

    case 'delivery-tomorrow':
      return `See you tomorrow between ${data.deliveryWindow}.

Driver will call when close.

Karl`;

    case '30-day-checkin':
      return `${data.customerName}, been 30 days - how's the mattress?

Just reply and let me know.

Remember you've got 70 more nights if you want to change anything.

Karl
0450 606 589`;

    default:
      return '';
  }
}

/**
 * Convert plain text to minimal HTML with proper button for quote emails
 * Light touch - preserves the simplicity while making it email-client friendly
 */
export function getMinimalHTMLEmail(templateId: string, data: EmailData): string {
  const content = getPlainTextEmail(templateId, data);
  const lines = content.split('\n');
  
  // Only add button for quote template with payment link
  const hasButton = templateId === 'quote' && data.paymentLink;
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff;">
${lines.map((line, index) => {
  // Convert payment link to button in quote emails
  if (hasButton && line.includes('http')) {
    const url = line.trim();
    return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
  <tr>
    <td>
      <a href="${url}" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
        Complete Your Order →
      </a>
    </td>
  </tr>
</table>`;
  }
  
  // Handle list items
  if (line.startsWith('- ')) {
    return `<div style="margin: 4px 0; padding-left: 20px;">• ${line.substring(2)}</div>`;
  }
  
  // Handle section headers
  if (line.includes('What you selected:')) {
    return `<div style="margin-top: 20px; margin-bottom: 10px; font-weight: 600;">${line}</div>`;
  }
  
  // Handle signature
  if (line === 'Karl') {
    return `<div style="margin-top: 30px; font-weight: 600;">${line}</div>`;
  }
  
  // Handle phone number
  if (line.includes('0450 606 589')) {
    return `<div style="color: #666;">${line}</div>`;
  }
  
  // Handle empty lines
  if (line.trim() === '') {
    return '<div style="height: 10px;"></div>';
  }
  
  // Regular lines
  return `<div style="margin: 8px 0;">${line}</div>`;
}).join('')}
</body>
</html>`;
}

/**
 * Get the fancy HTML template (the old hardcoded one from send-quote)
 * Keeping this for backwards compatibility but should phase it out
 */
export function getFancyHTMLEmail(data: EmailData, emailType: 'quote' | 'paid' = 'quote'): string {
  const isPaid = emailType === 'paid';
  const title = isPaid ? 'Invoice Paid' : 'Your Quote';
  const message = isPaid 
    ? 'Thank you for your payment! Your mattress order is confirmed.'
    : 'Your custom mattress quote is ready.';
  
  const checkoutUrl = `${process.env.NEXT_PUBLIC_URL || 'https://invoice-app-ausbeds.vercel.app'}/checkout/${data.quoteNumber}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
        .header { background: #2563eb; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .items { margin: 20px 0; }
        .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .totals { margin-top: 20px; padding-top: 20px; border-top: 2px solid #333; }
        .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
        .total-row.final { font-weight: bold; font-size: 1.2em; color: #2563eb; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Ausbeds</h1>
            <h2>${title} #${data.quoteNumber}</h2>
        </div>
        
        <div class="content">
            <p>Hi ${data.customerName},</p>
            <p>${message}</p>
            
            <div class="items">
                <h3>Order Details:</h3>
                ${data.items.map(item => `
                    <div class="item">
                        <span>${item.name} (${item.sku}) x${item.quantity}</span>
                        <span>$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="totals">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>$${(data.total - (data.gstAmount || 0)).toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>GST:</span>
                    <span>$${(data.gstAmount || 0).toFixed(2)}</span>
                </div>
                <div class="total-row final">
                    <span>Total:</span>
                    <span>$${data.total.toFixed(2)}</span>
                </div>
            </div>
            
            ${!isPaid ? `
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${checkoutUrl}" class="button">Complete Your Purchase</a>
                </div>
            ` : `
                <div style="margin: 30px 0; padding: 20px; background: #f0fdf4; border-radius: 5px;">
                    <p style="color: #16a34a; font-weight: bold;">✓ Payment Confirmed</p>
                    <p>We'll be in touch soon about delivery arrangements.</p>
                </div>
            `}
            
            <div style="margin-top: 30px;">
                <p><strong>Customer Details:</strong></p>
                <p>${data.customerName}<br>
                ${data.customerEmail}<br>
                ${data.customerPhone || 'No phone provided'}<br>
                ${data.customerAddress || 'No address provided'}</p>
            </div>
        </div>
        
        <div class="footer">
            <p>Ausbeds - Custom Mattresses Made in Sydney</p>
            <p>📱 0450 606 589 | ✉️ sales@ausbeds.com.au</p>
            <p>100 Night Trial • 10 Year Warranty</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Get email subject based on template type
 */
export function getEmailSubject(emailType: 'quote' | 'paid', customerName: string): string {
  if (emailType === 'paid') {
    return `Invoice Paid - ${customerName} - Ausbeds`;
  }
  return `Your Ausbeds Quote - ${customerName}`;
}