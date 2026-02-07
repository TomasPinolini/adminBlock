-- ========================================
-- ALL-IN-ONE SCHEMA FIX
-- Run this ONCE in Supabase SQL Editor
-- ========================================

-- Fix 1: Convert TEXT boolean columns to actual BOOLEAN
-- materials.is_active
ALTER TABLE materials 
    ALTER COLUMN is_active DROP DEFAULT,
    ALTER COLUMN is_active TYPE BOOLEAN USING (is_active::text = 'true'),
    ALTER COLUMN is_active SET DEFAULT true,
    ALTER COLUMN is_active SET NOT NULL;

-- orders.is_archived
ALTER TABLE orders 
    ALTER COLUMN is_archived DROP DEFAULT,
    ALTER COLUMN is_archived TYPE BOOLEAN USING (is_archived::text = 'true'),
    ALTER COLUMN is_archived SET DEFAULT false,
    ALTER COLUMN is_archived SET NOT NULL;

-- services.is_active
ALTER TABLE services 
    ALTER COLUMN is_active DROP DEFAULT,
    ALTER COLUMN is_active TYPE BOOLEAN USING (is_active::text = 'true'),
    ALTER COLUMN is_active SET DEFAULT true,
    ALTER COLUMN is_active SET NOT NULL;

-- suppliers.is_active
ALTER TABLE suppliers 
    ALTER COLUMN is_active DROP DEFAULT,
    ALTER COLUMN is_active TYPE BOOLEAN USING (is_active::text = 'true'),
    ALTER COLUMN is_active SET DEFAULT true,
    ALTER COLUMN is_active SET NOT NULL;

-- Done! Verify:
SELECT 
    table_name, 
    column_name, 
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name IN ('orders', 'suppliers', 'materials', 'services')
  AND column_name IN ('is_archived', 'is_active')
ORDER BY table_name, column_name;
