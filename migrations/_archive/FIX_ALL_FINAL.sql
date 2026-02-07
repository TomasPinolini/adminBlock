-- ========================================
-- FINAL FIX - Drop defaults, convert type, set boolean defaults
-- ========================================

-- Fix materials.is_active
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'materials' 
        AND column_name = 'is_active'
        AND data_type = 'text'
    ) THEN
        -- Step 1: Drop default
        ALTER TABLE materials ALTER COLUMN is_active DROP DEFAULT;
        
        -- Step 2: Convert to boolean
        ALTER TABLE materials 
        ALTER COLUMN is_active TYPE BOOLEAN 
        USING (lower(trim(is_active)) IN ('true', 't', '1'));
        
        -- Step 3: Set boolean default
        ALTER TABLE materials ALTER COLUMN is_active SET DEFAULT true;
        ALTER TABLE materials ALTER COLUMN is_active SET NOT NULL;
        
        RAISE NOTICE 'Fixed materials.is_active';
    END IF;
END $$;

-- Fix orders.is_archived
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'is_archived'
        AND data_type = 'text'
    ) THEN
        ALTER TABLE orders ALTER COLUMN is_archived DROP DEFAULT;
        
        ALTER TABLE orders 
        ALTER COLUMN is_archived TYPE BOOLEAN 
        USING (lower(trim(is_archived)) IN ('true', 't', '1'));
        
        ALTER TABLE orders ALTER COLUMN is_archived SET DEFAULT false;
        ALTER TABLE orders ALTER COLUMN is_archived SET NOT NULL;
        
        RAISE NOTICE 'Fixed orders.is_archived';
    END IF;
END $$;

-- Fix services.is_active
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' 
        AND column_name = 'is_active'
        AND data_type = 'text'
    ) THEN
        ALTER TABLE services ALTER COLUMN is_active DROP DEFAULT;
        
        ALTER TABLE services 
        ALTER COLUMN is_active TYPE BOOLEAN 
        USING (lower(trim(is_active)) IN ('true', 't', '1'));
        
        ALTER TABLE services ALTER COLUMN is_active SET DEFAULT true;
        ALTER TABLE services ALTER COLUMN is_active SET NOT NULL;
        
        RAISE NOTICE 'Fixed services.is_active';
    END IF;
END $$;

-- Fix suppliers.is_active
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'is_active'
        AND data_type = 'text'
    ) THEN
        ALTER TABLE suppliers ALTER COLUMN is_active DROP DEFAULT;
        
        ALTER TABLE suppliers 
        ALTER COLUMN is_active TYPE BOOLEAN 
        USING (lower(trim(is_active)) IN ('true', 't', '1'));
        
        ALTER TABLE suppliers ALTER COLUMN is_active SET DEFAULT true;
        ALTER TABLE suppliers ALTER COLUMN is_active SET NOT NULL;
        
        RAISE NOTICE 'Fixed suppliers.is_active';
    END IF;
END $$;

-- Verify final state
SELECT 
    table_name, 
    column_name, 
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name IN ('orders', 'suppliers', 'materials', 'services')
  AND column_name IN ('is_archived', 'is_active')
ORDER BY table_name, column_name;
