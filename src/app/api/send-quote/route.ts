import { NextRequest, NextResponse } from 'next/server';
import { createQuote, createOrUpdateCustomer } from '../../../../lib/db';
import { createEmailTransporter, getEmailFrom } from '../../../utils/email';
import { getMinimalHTMLEmail, getEmailSubject } from '../../../utils/emailTemplates';
import { BUSINESS_INFO } from '../../../config/business';

export async function POST(req: NextRequest) {
  try {
    const { invoice, recipientEmail, message } = await req.json();

    if (!invoice || !recipientEmail) {
      return NextResponse.json(
        { error: 'Invoice and recipient email are required' },
        { status: 400 }
      );
    }

    // Create transporter using our email utility
    const transporter = createEmailTransporter();

    // Calculate totals
    const total = invoice.total || invoice.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);
    const gstAmount = total * (invoice.taxRate / (100 + invoice.taxRate));
    const exGstAmount = total - gstAmount;

    // Save quote to database if it doesn't have an ID
    let quoteNumber = invoice.invoiceNumber;
    if (!invoice.id || invoice.id === 'quote') {
      // Generate quote number if not provided
      if (!quoteNumber) {
        const timestamp = Date.now();
        quoteNumber = `AUS-${timestamp}`;
      }

      try {
        // Create or update customer
        await createOrUpdateCustomer({
          name: invoice.customerName,
          email: invoice.customerEmail,
          phone: invoice.customerPhone,
          address: invoice.customerAddress,
        });

        // Create quote without delivery access (customer will select when paying)
        const savedQuote = await createQuote({
          quoteNumber,
          customerName: invoice.customerName,
          customerEmail: invoice.customerEmail,
          customerPhone: invoice.customerPhone,
          customerAddress: invoice.customerAddress,
          items: invoice.items,
          subtotal: total,
          gst: gstAmount,
          total: total,
          // Don't include deliveryAccess - let it default to undefined
        });

        quoteNumber = savedQuote.quote_number;
      } catch (dbError) {
        console.error('Error saving quote to database:', dbError);
        // Continue with email sending even if database save fails
      }
    }

    // Create payment link that goes to the invoice app checkout page
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://invoice-app-ausbeds.vercel.app';
    // Link to the checkout page (not quote page) for direct payment
    const paymentLink = `${baseUrl}/checkout/${quoteNumber || invoice.id || 'quote'}`;

    // Use the new clean template system instead of hardcoded HTML
    const emailData = {
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerPhone: invoice.customerPhone,
      customerAddress: invoice.customerAddress,
      quoteNumber: quoteNumber || invoice.invoiceNumber || 'QUOTE',
      total: total,
      gstAmount: gstAmount,
      items: invoice.items,
      paymentLink: paymentLink,
      message: message,
      // Include delivery preferences if they exist
      deliveryDate: invoice.deliveryDate,
      deliveryWindow: invoice.deliveryWindow,
      hasStairs: invoice.hasStairs,
      twoPersonDelivery: invoice.twoPersonDelivery,
      removeOldMattress: invoice.removeOldMattress,
      deliveryInstructions: invoice.deliveryInstructions
    };

    // Get the clean, minimal HTML email like Karl actually sends
    const htmlContent = getMinimalHTMLEmail('quote', emailData);

    // Email options
    const mailOptions = {
      from: getEmailFrom(),
      to: recipientEmail,
      subject: getEmailSubject('quote', invoice.customerName),
      html: htmlContent,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      success: true, 
      message: 'Quote sent successfully' 
    });

  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}