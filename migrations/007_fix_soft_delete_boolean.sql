-- Migration: Fix Soft Delete to use BOOLEAN instead of TEXT
-- Description: Convert is_archived, is_active columns from TEXT to BOOLEAN
-- Date: 2026-02-06
-- Idempotent: Only converts columns that are still TEXT

-- Fix orders.is_archived
DO $$ 
DECLARE
    col_type text;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'is_archived';
    
    IF col_type = 'text' THEN
        ALTER TABLE orders ALTER COLUMN is_archived DROP DEFAULT;
        ALTER TABLE orders ALTER COLUMN is_archived TYPE BOOLEAN 
            USING CASE WHEN is_archived = 'true' THEN true ELSE false END;
        ALTER TABLE orders ALTER COLUMN is_archived SET DEFAULT false;
        ALTER TABLE orders ALTER COLUMN is_archived SET NOT NULL;
    ELSIF col_type = 'boolean' THEN
        -- Already boolean, just ensure defaults are correct
        ALTER TABLE orders ALTER COLUMN is_archived SET DEFAULT false;
        ALTER TABLE orders ALTER COLUMN is_archived SET NOT NULL;
    END IF;
END $$;

-- Fix suppliers.is_active
DO $$ 
DECLARE
    col_type text;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'is_active';
    
    IF col_type = 'text' THEN
        ALTER TABLE suppliers ALTER COLUMN is_active DROP DEFAULT;
        ALTER TABLE suppliers ALTER COLUMN is_active TYPE BOOLEAN 
            USING CASE WHEN is_active = 'true' THEN true ELSE false END;
        ALTER TABLE suppliers ALTER COLUMN is_active SET DEFAULT true;
        ALTER TABLE suppliers ALTER COLUMN is_active SET NOT NULL;
    ELSIF col_type = 'boolean' THEN
        ALTER TABLE suppliers ALTER COLUMN is_active SET DEFAULT true;
        ALTER TABLE suppliers ALTER COLUMN is_active SET NOT NULL;
    END IF;
END $$;

-- Fix materials.is_active
DO $$ 
DECLARE
    col_type text;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns 
    WHERE table_name = 'materials' AND column_name = 'is_active';
    
    IF col_type = 'text' THEN
        ALTER TABLE materials ALTER COLUMN is_active DROP DEFAULT;
        ALTER TABLE materials ALTER COLUMN is_active TYPE BOOLEAN 
            USING CASE WHEN is_active = 'true' THEN true ELSE false END;
        ALTER TABLE materials ALTER COLUMN is_active SET DEFAULT true;
        ALTER TABLE materials ALTER COLUMN is_active SET NOT NULL;
    ELSIF col_type = 'boolean' THEN
        ALTER TABLE materials ALTER COLUMN is_active SET DEFAULT true;
        ALTER TABLE materials ALTER COLUMN is_active SET NOT NULL;
    END IF;
END $$;

-- Fix services.is_active
DO $$ 
DECLARE
    col_type text;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'is_active';
    
    IF col_type = 'text' THEN
        ALTER TABLE services ALTER COLUMN is_active DROP DEFAULT;
        ALTER TABLE services ALTER COLUMN is_active TYPE BOOLEAN 
            USING CASE WHEN is_active = 'true' THEN true ELSE false END;
        ALTER TABLE services ALTER COLUMN is_active SET DEFAULT true;
        ALTER TABLE services ALTER COLUMN is_active SET NOT NULL;
    ELSIF col_type = 'boolean' THEN
        ALTER TABLE services ALTER COLUMN is_active SET DEFAULT true;
        ALTER TABLE services ALTER COLUMN is_active SET NOT NULL;
    END IF;
END $$;

-- Verify the changes
SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns
WHERE (table_name = 'orders' AND column_name = 'is_archived')
   OR (table_name = 'suppliers' AND column_name = 'is_active')
   OR (table_name = 'materials' AND column_name = 'is_active')
   OR (table_name = 'services' AND column_name = 'is_active');
