-- Add address to clients table (dad tracks DIRECCION on paper)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address TEXT;

-- Add metadata JSONB to orders table (structured service-specific data)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Ensure "termocopiado" service exists
INSERT INTO services (name, display_name, description, is_active, sort_order)
VALUES ('termocopiado', 'Termocopiado', 'Termocopiados de libros y documentos', true, 0)
ON CONFLICT (name) DO NOTHING;

-- Add index on orders.service_type for fast filtering
CREATE INDEX IF NOT EXISTS idx_orders_service_type ON orders (service_type);
