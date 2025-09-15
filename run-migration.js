// GORDON'S MIGRATION RUNNER - FIX THE BLOODY DATABASE!

const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  console.log("🔪 GORDON'S RUNNING THE DELIVERY_ACCESS MIGRATION...");
  
  try {
    // First, check current column type
    const checkResult = await sql`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'quotes' 
      AND column_name = 'delivery_access'
    `;
    
    console.log("Current delivery_access column:", checkResult.rows[0]);
    
    if (checkResult.rows[0]?.character_maximum_length === 50) {
      console.log("📍 Column is VARCHAR(50), needs to be increased!");
      
      // Run the migration
      await sql`
        ALTER TABLE quotes 
        ALTER COLUMN delivery_access TYPE VARCHAR(255)
      `;
      
      console.log("✅ SUCCESS! delivery_access column increased to VARCHAR(255)");
      
      // Verify the change
      const verifyResult = await sql`
        SELECT column_name, data_type, character_maximum_length 
        FROM information_schema.columns 
        WHERE table_name = 'quotes' 
        AND column_name = 'delivery_access'
      `;
      
      console.log("New delivery_access column:", verifyResult.rows[0]);
    } else if (checkResult.rows[0]?.character_maximum_length === 255) {
      console.log("✅ Column already VARCHAR(255), no migration needed!");
    } else {
      console.log("⚠️ Unexpected column size:", checkResult.rows[0]?.character_maximum_length);
    }
    
  } catch (error) {
    console.error("❌ MIGRATION FAILED:", error.message);
    console.error("Full error:", error);
  } finally {
    process.exit();
  }
}

runMigration();