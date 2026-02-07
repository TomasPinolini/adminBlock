-- Migration: Fix is_required to use BOOLEAN instead of TEXT
-- Description: Convert service_materials.is_required from TEXT to BOOLEAN for type safety
-- Date: 2026-02-06
-- Idempotent: Only converts if column is still TEXT

DO $$ 
DECLARE
    col_type text;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns 
    WHERE table_name = 'service_materials' AND column_name = 'is_required';
    
    IF col_type = 'text' THEN
        ALTER TABLE service_materials ALTER COLUMN is_required DROP DEFAULT;
        ALTER TABLE service_materials ALTER COLUMN is_required TYPE BOOLEAN 
            USING CASE WHEN is_required = 'true' THEN true ELSE false END;
        ALTER TABLE service_materials ALTER COLUMN is_required SET DEFAULT false;
        ALTER TABLE service_materials ALTER COLUMN is_required SET NOT NULL;
    ELSIF col_type = 'boolean' THEN
        -- Already boolean, just ensure defaults are correct
        ALTER TABLE service_materials ALTER COLUMN is_required SET DEFAULT false;
        ALTER TABLE service_materials ALTER COLUMN is_required SET NOT NULL;
    END IF;
END $$;

-- Verify the change
SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'service_materials' AND column_name = 'is_required';
