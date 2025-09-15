import { sql } from '@vercel/postgres';

// Initialize database tables
export async function initDatabase() {
  try {
    // Create quotes table
    await sql`
      CREATE TABLE IF NOT EXISTS quotes (
        id SERIAL PRIMARY KEY,
        quote_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        customer_address TEXT,
        items JSONB NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        gst DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        payment_status VARCHAR(50) DEFAULT 'pending',
        stripe_payment_intent_id VARCHAR(255),
        delivery_access VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        deleted_at TIMESTAMP
      )
    `;
    
    // Add notes column if it doesn't exist (migration for existing databases)
    await sql`
      ALTER TABLE quotes 
      ADD COLUMN IF NOT EXISTS notes TEXT
    `.catch(() => {
      // Column might already exist, that's fine
      console.log('Notes column already exists or could not be added');
    });

    // Create customers table
    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create payments table
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        quote_id INTEGER REFERENCES quotes(id),
        stripe_payment_intent_id VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'aud',
        status VARCHAR(50) NOT NULL,
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Add deleted_at column if it doesn't exist (migration for existing tables)
    await sql`
      ALTER TABLE quotes 
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP
    `;

    // GORDON'S FIX: Increase delivery_access field size from VARCHAR(50) to VARCHAR(255)
    // Some users were accidentally putting full addresses instead of dropdown values!
    await sql`
      ALTER TABLE quotes 
      ALTER COLUMN delivery_access TYPE VARCHAR(255)
    `.catch(() => {
      // Column might already be the right size, that's fine
      console.log('Delivery access column already migrated or could not be altered');
    });

    // GORDON'S PERFORMANCE FIX: Add indexes for speed!
    // Create indexes for faster queries (CONCURRENTLY to avoid locking)
    await sql`CREATE INDEX IF NOT EXISTS idx_quotes_deleted_at ON quotes(deleted_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_quotes_customer_email ON quotes(customer_email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_quotes_payment_status ON quotes(payment_status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_quote_id ON payments(quote_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_payments_stripe_id ON payments(stripe_payment_intent_id)`;
    
    // Composite index for common query pattern
    await sql`
      CREATE INDEX IF NOT EXISTS idx_quotes_deleted_created 
      ON quotes(deleted_at, created_at DESC) 
      WHERE deleted_at IS NULL
    `;

    console.log('Database tables and indexes initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Quote operations
export async function createQuote(quoteData: {
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  items: any[];
  subtotal: number;
  gst: number;
  total: number;
  deliveryAccess?: string;
  notes?: string;
}) {
  try {
    const { rows } = await sql`
      INSERT INTO quotes (
        quote_number, customer_name, customer_email, customer_phone, 
        customer_address, items, subtotal, gst, total, delivery_access, notes
      )
      VALUES (
        ${quoteData.quoteNumber}, ${quoteData.customerName}, ${quoteData.customerEmail},
        ${quoteData.customerPhone || null}, ${quoteData.customerAddress || null},
        ${JSON.stringify(quoteData.items)}, ${quoteData.subtotal}, ${quoteData.gst}, ${quoteData.total},
        ${quoteData.deliveryAccess || null}, ${quoteData.notes || null}
      )
      RETURNING *
    `;
    return rows[0];
  } catch (error) {
    console.error('Database error creating quote:', error);
    console.error('Quote data that failed:', quoteData);
    throw error;
  }
}

export async function getQuote(quoteNumber: string) {
  const { rows } = await sql`
    SELECT * FROM quotes WHERE quote_number = ${quoteNumber}
  `;
  return rows[0];
}

export async function updateQuoteStatus(quoteNumber: string, status: string, paymentStatus?: string) {
  if (paymentStatus) {
    const { rows } = await sql`
      UPDATE quotes 
      SET status = ${status}, 
          payment_status = ${paymentStatus},
          updated_at = CURRENT_TIMESTAMP
      WHERE quote_number = ${quoteNumber}
      RETURNING *
    `;
    return rows[0];
  } else {
    const { rows } = await sql`
      UPDATE quotes 
      SET status = ${status}, 
          updated_at = CURRENT_TIMESTAMP
      WHERE quote_number = ${quoteNumber}
      RETURNING *
    `;
    return rows[0];
  }
}

export async function updateQuotePaymentIntent(quoteNumber: string, paymentIntentId: string) {
  const { rows } = await sql`
    UPDATE quotes 
    SET stripe_payment_intent_id = ${paymentIntentId},
        updated_at = CURRENT_TIMESTAMP
    WHERE quote_number = ${quoteNumber}
    RETURNING *
  `;
  return rows[0];
}

// Customer operations
export async function createOrUpdateCustomer(customerData: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}) {
  const { rows } = await sql`
    INSERT INTO customers (name, email, phone, address)
    VALUES (${customerData.name}, ${customerData.email}, ${customerData.phone || null}, ${customerData.address || null})
    ON CONFLICT (email) 
    DO UPDATE SET 
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      address = EXCLUDED.address,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  return rows[0];
}

export async function getCustomer(email: string) {
  const { rows } = await sql`
    SELECT * FROM customers WHERE email = ${email}
  `;
  return rows[0];
}

// Payment operations
export async function createPayment(paymentData: {
  quoteId: number;
  stripePaymentIntentId: string;
  amount: number;
  status: string;
  paymentMethod?: string;
}) {
  const { rows } = await sql`
    INSERT INTO payments (quote_id, stripe_payment_intent_id, amount, status, payment_method)
    VALUES (${paymentData.quoteId}, ${paymentData.stripePaymentIntentId}, ${paymentData.amount}, ${paymentData.status}, ${paymentData.paymentMethod || null})
    RETURNING *
  `;
  return rows[0];
}

// GORDON'S FIX: Pagination to stop loading the entire bloody database!
export async function getAllQuotes(limit = 50, offset = 0) {
  const { rows } = await sql`
    SELECT * FROM quotes 
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return rows;
}

// Get total count of quotes for pagination
export async function getTotalQuotesCount() {
  const { rows } = await sql`
    SELECT COUNT(*) as count FROM quotes 
    WHERE deleted_at IS NULL
  `;
  return parseInt(rows[0].count);
}

// Soft delete quotes
export async function softDeleteQuotes(quoteNumbers: string[]) {
  if (quoteNumbers.length === 0) return [];
  
  // Create placeholders for the SQL query
  const placeholders = quoteNumbers.map((_, index) => `$${index + 1}`).join(', ');
  
  const query = `
    UPDATE quotes 
    SET deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE quote_number IN (${placeholders})
    AND deleted_at IS NULL
    RETURNING *
  `;
  
  const { rows } = await sql.query(query, quoteNumbers);
  return rows;
}

// Get deleted quotes (for potential recovery feature)
export async function getDeletedQuotes() {
  const { rows } = await sql`
    SELECT * FROM quotes 
    WHERE deleted_at IS NOT NULL
    ORDER BY deleted_at DESC
  `;
  return rows;
}

export async function updateQuoteDeliveryAccess(quoteNumber: string, deliveryAccess: string) {
  const { rows } = await sql`
    UPDATE quotes 
    SET delivery_access = ${deliveryAccess},
        updated_at = CURRENT_TIMESTAMP
    WHERE quote_number = ${quoteNumber}
    RETURNING *
  `;
  return rows[0];
}

export async function updateQuoteCustomerDetails(
  quoteNumber: string, 
  customerData: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerAddress?: string;
  }
) {
  const { rows } = await sql`
    UPDATE quotes 
    SET customer_name = ${customerData.customerName},
        customer_email = ${customerData.customerEmail},
        customer_phone = ${customerData.customerPhone || null},
        customer_address = ${customerData.customerAddress || null},
        updated_at = CURRENT_TIMESTAMP
    WHERE quote_number = ${quoteNumber}
    RETURNING *
  `;
  return rows[0];
}
