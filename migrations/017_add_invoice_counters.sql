-- Invoice counters for auto-numbering
CREATE TABLE IF NOT EXISTS invoice_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_type TEXT NOT NULL,
  punto_venta TEXT NOT NULL DEFAULT '00001',
  next_number INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(invoice_type, punto_venta)
);

-- Enable RLS
ALTER TABLE invoice_counters ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "invoice_counters_all" ON invoice_counters
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed initial rows for common invoice types
INSERT INTO invoice_counters (invoice_type, punto_venta, next_number)
VALUES
  ('A', '00001', 1),
  ('B', '00001', 1),
  ('C', '00001', 1),
  ('C_E', '00001', 1)
ON CONFLICT (invoice_type, punto_venta) DO NOTHING;
