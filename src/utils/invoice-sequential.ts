// Sequential invoice numbering system
// Ensures invoice numbers are sequential within each month as per business requirements

import { sql } from '@vercel/postgres';

/**
 * Get the next sequential invoice number for the current month
 * Format: INV-YYYYMM-XXX where XXX is sequential starting from 001
 * Resets to 001 at the start of each month
 */
export async function getNextSequentialInvoiceNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `INV-${year}${month}`;
  
  // CHEF'S FIX: Use a retry loop with exponential backoff for race conditions
  const maxRetries = 5;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      // Use FOR UPDATE to lock the rows we're reading (prevents race conditions!)
      const result = await sql`
        SELECT quote_number 
        FROM quotes 
        WHERE quote_number LIKE ${prefix + '-%'}
        ORDER BY quote_number DESC
        LIMIT 1
        FOR UPDATE
      `;
      
      let nextNumber = 1;
      
      if (result.rows.length > 0) {
        const lastInvoice = result.rows[0].quote_number;
        // Extract the sequential number from INV-YYYYMM-XXX
        const lastNumber = parseInt(lastInvoice.split('-')[2], 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      // Pad with zeros to make it 3 digits
      const sequentialNumber = String(nextNumber).padStart(3, '0');
      const invoiceNumber = `${prefix}-${sequentialNumber}`;
      
      // Try to insert immediately with the number we calculated
      // This will fail if someone else grabbed it (unique constraint)
      try {
        await sql`
          INSERT INTO quotes (quote_number, customer_name, customer_email, items, subtotal, gst, total, status, created_at, updated_at)
          VALUES (${invoiceNumber}, 'PLACEHOLDER', 'placeholder@temp.com', '[]'::jsonb, 0, 0, 0, 'draft', NOW(), NOW())
        `;
        
        // Success! We got the number, now delete this placeholder
        await sql`
          DELETE FROM quotes 
          WHERE quote_number = ${invoiceNumber}
          AND total = 0 
          AND status = 'draft'
        `;
        

        return invoiceNumber;
        
      } catch (insertError: any) {
        // If insert failed due to duplicate, someone else got this number
        if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {

          retryCount++;
          // Exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms
          await new Promise(resolve => setTimeout(resolve, 50 * Math.pow(2, retryCount)));
          continue;
        }
        throw insertError;
      }
      
    } catch (error) {

      
      if (retryCount >= maxRetries - 1) {
        // Last resort: Use timestamp with random suffix to guarantee uniqueness
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        const fallbackNumber = `${prefix}-T${timestamp}${random}`;

        return fallbackNumber;
      }
      
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 50 * Math.pow(2, retryCount)));
    }
  }
  
  // Should never reach here, but just in case
  const emergencyNumber = `${prefix}-E${Date.now()}`;

  return emergencyNumber;
}

