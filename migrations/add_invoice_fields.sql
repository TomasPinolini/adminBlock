-- Add invoice type enum
CREATE TYPE invoice_type AS ENUM ('A', 'B', 'none');

-- Add CUIT field to clients table
ALTER TABLE clients 
ADD COLUMN cuit TEXT;

-- Add invoice fields to orders table
ALTER TABLE orders 
ADD COLUMN invoice_number TEXT,
ADD COLUMN invoice_type invoice_type DEFAULT 'none',
ADD COLUMN quantity NUMERIC(10, 2),
ADD COLUMN subtotal NUMERIC(10, 2),
ADD COLUMN tax_amount NUMERIC(10, 2);

-- Add index for invoice number lookups
CREATE INDEX idx_orders_invoice_number ON orders(invoice_number) WHERE invoice_number IS NOT NULL;

-- Add index for CUIT lookups
CREATE INDEX idx_clients_cuit ON clients(cuit) WHERE cuit IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN clients.cuit IS 'CUIT for invoicing purposes';
COMMENT ON COLUMN orders.invoice_number IS 'Invoice number (e.g., 3079, 1209)';
COMMENT ON COLUMN orders.invoice_type IS 'Type of invoice: A (with IVA), B (monotributo), or none';
COMMENT ON COLUMN orders.quantity IS 'Quantity of units for the order';
COMMENT ON COLUMN orders.subtotal IS 'Amount without IVA';
COMMENT ON COLUMN orders.tax_amount IS 'IVA amount (21% for type A invoices)';
