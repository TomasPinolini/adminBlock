-- Migration: Fix Soft Delete to use BOOLEAN instead of TEXT
-- Description: Convert is_archived, is_active columns from TEXT to BOOLEAN
-- Date: 2026-02-06

-- Fix orders.is_archived
ALTER TABLE orders 
ALTER COLUMN is_archived TYPE BOOLEAN 
USING (is_archived = 'true');

ALTER TABLE orders 
ALTER COLUMN is_archived SET DEFAULT false;

ALTER TABLE orders 
ALTER COLUMN is_archived SET NOT NULL;

-- Fix suppliers.is_active
ALTER TABLE suppliers 
ALTER COLUMN is_active TYPE BOOLEAN 
USING (is_active = 'true');

ALTER TABLE suppliers 
ALTER COLUMN is_active SET DEFAULT true;

ALTER TABLE suppliers 
ALTER COLUMN is_active SET NOT NULL;

-- Fix materials.is_active
ALTER TABLE materials 
ALTER COLUMN is_active TYPE BOOLEAN 
USING (is_active = 'true');

ALTER TABLE materials 
ALTER COLUMN is_active SET DEFAULT true;

ALTER TABLE materials 
ALTER COLUMN is_active SET NOT NULL;

-- Verify the changes
SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns
WHERE (table_name = 'orders' AND column_name = 'is_archived')
   OR (table_name = 'suppliers' AND column_name = 'is_active')
   OR (table_name = 'materials' AND column_name = 'is_active');
