-- EXECUTE THIS AFTER PAUSING VERCEL DEPLOYMENT
-- Should take less than 1 second to run

-- Add CUIT to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cuit TEXT;

-- Add invoice fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_type TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity NUMERIC(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10, 2);

-- Set default for invoice_type
ALTER TABLE orders ALTER COLUMN invoice_type SET DEFAULT 'none';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_orders_invoice_number ON orders(invoice_number) WHERE invoice_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_cuit ON clients(cuit) WHERE cuit IS NOT NULL;

-- Add comments
COMMENT ON COLUMN clients.cuit IS 'CUIT for invoicing purposes';
COMMENT ON COLUMN orders.invoice_number IS 'Invoice number (e.g., 3079, 1209)';
COMMENT ON COLUMN orders.invoice_type IS 'Type of invoice: A (with IVA), B (monotributo), or none';
COMMENT ON COLUMN orders.quantity IS 'Quantity of units for the order';
COMMENT ON COLUMN orders.subtotal IS 'Amount without IVA';
COMMENT ON COLUMN orders.tax_amount IS 'IVA amount (21% for type A invoices)';
