-- Migration: Fix service_prices.service_type to use TEXT instead of ENUM
-- Description: Convert service_prices table to use TEXT for service_type (consistency with migration 004)
-- Date: 2026-02-06
-- Note: This table appears unused in the application but is being migrated for consistency
-- Idempotent: Only converts if column is still ENUM

DO $$ 
BEGIN
  -- Check if service_prices table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'service_prices'
  ) THEN
    -- Add temporary text column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'service_prices' AND column_name = 'service_type_temp'
    ) THEN
      ALTER TABLE service_prices ADD COLUMN service_type_temp TEXT;
    END IF;
    
    -- Copy data from enum to text (only if not already copied)
    UPDATE service_prices 
    SET service_type_temp = service_type::text 
    WHERE service_type_temp IS NULL;
    
    -- Drop and rename if service_type is still an enum
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'service_prices' 
      AND column_name = 'service_type'
      AND data_type = 'USER-DEFINED'
    ) THEN
      ALTER TABLE service_prices DROP COLUMN service_type;
      ALTER TABLE service_prices RENAME COLUMN service_type_temp TO service_type;
      ALTER TABLE service_prices ALTER COLUMN service_type SET NOT NULL;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'service_prices' AND column_name = 'service_type_temp'
    ) THEN
      -- Temp column exists but service_type is already text, just clean up
      ALTER TABLE service_prices DROP COLUMN service_type_temp;
    END IF;
  END IF;
END $$;

-- Verify the change (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'service_prices'
  ) THEN
    RAISE NOTICE 'service_prices table migrated successfully';
  ELSE
    RAISE NOTICE 'service_prices table does not exist - skipping migration';
  END IF;
END $$;
