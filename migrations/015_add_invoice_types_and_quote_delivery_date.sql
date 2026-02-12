-- Migration: Add new invoice types + delivery_date to quotes
-- Invoice types: Factura C, Nota de Credito/Debito C, Recibo C, Factura C Electronica, NC/ND C Electronica

-- 1. Add new values to invoice_type enum
ALTER TYPE invoice_type ADD VALUE IF NOT EXISTS 'C';
ALTER TYPE invoice_type ADD VALUE IF NOT EXISTS 'NC_C';
ALTER TYPE invoice_type ADD VALUE IF NOT EXISTS 'ND_C';
ALTER TYPE invoice_type ADD VALUE IF NOT EXISTS 'R_C';
ALTER TYPE invoice_type ADD VALUE IF NOT EXISTS 'C_E';
ALTER TYPE invoice_type ADD VALUE IF NOT EXISTS 'NC_C_E';
ALTER TYPE invoice_type ADD VALUE IF NOT EXISTS 'ND_C_E';

-- 2. Add delivery_date to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS delivery_date DATE;
