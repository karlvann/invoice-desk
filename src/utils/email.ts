import nodemailer from 'nodemailer';
import { getMinimalHTMLEmail, getEmailSubject } from './emailTemplates';

export function createEmailTransporter() {
  // Check which email service to use based on environment variables
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    // Use custom SMTP settings (recommended for production)
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    // Use Gmail
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  } else {
    throw new Error('No email configuration found. Please set up SMTP or Gmail credentials.');
  }
}

export function getEmailFrom() {
  const fromName = process.env.EMAIL_FROM_NAME || 'ausbeds';
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'noreply@ausbeds.com.au';
  return `${fromName} <${fromEmail}>`;
}

export async function sendInvoiceEmail(invoice: any, isPaid: boolean = false) {
  const transporter = createEmailTransporter();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://invoice-app-ausbeds.vercel.app';
  
  // Use the proper template system
  const templateId = isPaid ? 'paid' : 'quote';
  const paymentLink = !isPaid ? `${baseUrl}/checkout/${invoice.quote_number}` : undefined;
  
  // Prepare email data
  const emailData = {
    customerName: invoice.customer_name || invoice.customerName,
    customerEmail: invoice.customer_email || invoice.customerEmail,
    customerPhone: invoice.customer_phone || invoice.customerPhone,
    customerAddress: invoice.customer_address || invoice.customerAddress,
    quoteNumber: invoice.quote_number,
    total: parseFloat(invoice.total),
    gstAmount: parseFloat(invoice.gst),
    items: invoice.items || [],
    paymentLink: paymentLink,
    deliveryDate: invoice.deliveryDate,
    deliveryWindow: invoice.deliveryWindow,
    hasStairs: invoice.hasStairs,
    twoPersonDelivery: invoice.twoPersonDelivery,
    removeOldMattress: invoice.removeOldMattress,
    deliveryInstructions: invoice.deliveryInstructions
  };
  
  // Get the clean email template
  const htmlContent = getMinimalHTMLEmail(templateId, emailData);
  const subject = getEmailSubject(templateId, emailData.customerName);

  const mailOptions = {
    from: getEmailFrom(),
    to: invoice.customer_email || invoice.customerEmail,
    subject,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);

}