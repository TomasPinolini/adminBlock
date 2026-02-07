-- ========================================
-- ALL-IN-ONE SCHEMA FIX (Safe Version)
-- Checks column type before converting
-- ========================================

-- Fix materials.is_active (only if TEXT)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'materials' 
        AND column_name = 'is_active'
        AND data_type = 'text'
    ) THEN
        ALTER TABLE materials ALTER COLUMN is_active DROP DEFAULT;
        ALTER TABLE materials ALTER COLUMN is_active TYPE BOOLEAN USING (is_active = 'true');
        ALTER TABLE materials ALTER COLUMN is_active SET DEFAULT true;
        ALTER TABLE materials ALTER COLUMN is_active SET NOT NULL;
        RAISE NOTICE 'Fixed materials.is_active';
    ELSE
        RAISE NOTICE 'materials.is_active already correct type';
    END IF;
END $$;

-- Fix orders.is_archived (only if TEXT)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'is_archived'
        AND data_type = 'text'
    ) THEN
        ALTER TABLE orders ALTER COLUMN is_archived DROP DEFAULT;
        ALTER TABLE orders ALTER COLUMN is_archived TYPE BOOLEAN USING (is_archived = 'true');
        ALTER TABLE orders ALTER COLUMN is_archived SET DEFAULT false;
        ALTER TABLE orders ALTER COLUMN is_archived SET NOT NULL;
        RAISE NOTICE 'Fixed orders.is_archived';
    ELSE
        RAISE NOTICE 'orders.is_archived already correct type';
    END IF;
END $$;

-- Fix services.is_active (only if TEXT)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' 
        AND column_name = 'is_active'
        AND data_type = 'text'
    ) THEN
        ALTER TABLE services ALTER COLUMN is_active DROP DEFAULT;
        ALTER TABLE services ALTER COLUMN is_active TYPE BOOLEAN USING (is_active = 'true');
        ALTER TABLE services ALTER COLUMN is_active SET DEFAULT true;
        ALTER TABLE services ALTER COLUMN is_active SET NOT NULL;
        RAISE NOTICE 'Fixed services.is_active';
    ELSE
        RAISE NOTICE 'services.is_active already correct type';
    END IF;
END $$;

-- Fix suppliers.is_active (only if TEXT)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' 
        AND column_name = 'is_active'
        AND data_type = 'text'
    ) THEN
        ALTER TABLE suppliers ALTER COLUMN is_active DROP DEFAULT;
        ALTER TABLE suppliers ALTER COLUMN is_active TYPE BOOLEAN USING (is_active = 'true');
        ALTER TABLE suppliers ALTER COLUMN is_active SET DEFAULT true;
        ALTER TABLE suppliers ALTER COLUMN is_active SET NOT NULL;
        RAISE NOTICE 'Fixed suppliers.is_active';
    ELSE
        RAISE NOTICE 'suppliers.is_active already correct type';
    END IF;
END $$;

-- Verify results
SELECT 
    table_name, 
    column_name, 
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name IN ('orders', 'suppliers', 'materials', 'services')
  AND column_name IN ('is_archived', 'is_active')
ORDER BY table_name, column_name;
