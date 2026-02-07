-- Add invoice type enum (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE invoice_type AS ENUM ('A', 'B', 'none');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add CUIT field to clients table (only if it doesn't exist)
DO $$ BEGIN
    ALTER TABLE clients ADD COLUMN cuit TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add invoice fields to orders table (only if they don't exist)
DO $$ BEGIN
    ALTER TABLE orders ADD COLUMN invoice_number TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE orders ADD COLUMN invoice_type invoice_type DEFAULT 'none';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE orders ADD COLUMN quantity NUMERIC(10, 2);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE orders ADD COLUMN subtotal NUMERIC(10, 2);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE orders ADD COLUMN tax_amount NUMERIC(10, 2);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add index for invoice number lookups (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_orders_invoice_number ON orders(invoice_number) WHERE invoice_number IS NOT NULL;

-- Add index for CUIT lookups (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_clients_cuit ON clients(cuit) WHERE cuit IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN clients.cuit IS 'CUIT for invoicing purposes';
COMMENT ON COLUMN orders.invoice_number IS 'Invoice number (e.g., 3079, 1209)';
COMMENT ON COLUMN orders.invoice_type IS 'Type of invoice: A (with IVA), B (monotributo), or none';
COMMENT ON COLUMN orders.quantity IS 'Quantity of units for the order';
COMMENT ON COLUMN orders.subtotal IS 'Amount without IVA';
COMMENT ON COLUMN orders.tax_amount IS 'IVA amount (21% for type A invoices)';
