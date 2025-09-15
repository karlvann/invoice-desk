#!/usr/bin/env node

// GORDON'S CLEANUP SCRIPT - FIX THE BLOODY PLACEHOLDER MESS!

const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function cleanupPlaceholders() {
  console.log('🔪 CLEANING UP PLACEHOLDER RECORDS...');
  
  try {
    // Delete all quotes that look like placeholders
    const result = await sql`
      DELETE FROM quotes 
      WHERE (
        customer_name = 'PLACEHOLDER' 
        OR customer_name IS NULL
        OR total = 0
      )
      AND status = 'draft'
      AND payment_status = 'pending'
      RETURNING quote_number
    `;
    
    console.log(`✅ Deleted ${result.rowCount} placeholder records`);
    
    if (result.rows.length > 0) {
      console.log('Deleted invoice numbers:', result.rows.map(r => r.quote_number).join(', '));
    }
    
    // Show current state
    const remaining = await sql`
      SELECT COUNT(*) as count 
      FROM quotes 
      WHERE quote_number LIKE 'INV-202508-%'
    `;
    
    console.log(`📊 Remaining invoices for August 2025: ${remaining.rows[0].count}`);
    
    // Get the highest sequential number for current month
    const highest = await sql`
      SELECT quote_number 
      FROM quotes 
      WHERE quote_number LIKE 'INV-202508-%'
      AND quote_number NOT LIKE 'INV-202508-T%'
      AND quote_number NOT LIKE 'INV-202508-E%'
      ORDER BY quote_number DESC
      LIMIT 1
    `;
    
    if (highest.rows.length > 0) {
      console.log(`🔢 Highest sequential invoice: ${highest.rows[0].quote_number}`);
    } else {
      console.log('🆕 No sequential invoices yet - next will be INV-202508-001');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupPlaceholders();