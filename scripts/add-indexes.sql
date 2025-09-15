-- GORDON'S PERFORMANCE FIX: DATABASE INDEXES
-- These indexes will make your queries run like a Formula 1 car instead of a donkey!

-- Index for soft delete filtering (most queries filter by this)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_deleted_at ON quotes(deleted_at);

-- Index for sorting by creation date (ORDER BY in getAllQuotes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);

-- Index for customer email searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_customer_email ON quotes(customer_email);

-- Index for payment status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_payment_status ON quotes(payment_status);

-- Index for quote number lookups (used in getQuote)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number);

-- Index for status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_status ON quotes(status);

-- Composite index for common query pattern
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotes_deleted_created 
ON quotes(deleted_at, created_at DESC) 
WHERE deleted_at IS NULL;

-- Add index for customers table email lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_email ON customers(email);

-- Add index for payments table foreign key
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_quote_id ON payments(quote_id);

-- Add index for payments stripe ID lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_stripe_id ON payments(stripe_payment_intent_id);