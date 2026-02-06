-- Migration: Add dynamic services table and convert service_type from enum to text
-- This allows creating and managing service types dynamically instead of hardcoded enums

-- Step 1: Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active TEXT NOT NULL DEFAULT 'true',
  sort_order NUMERIC(10, 0) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 2: Insert existing service types from enum
INSERT INTO services (name, display_name, sort_order) VALUES
  ('copiado', 'Copiado', 1),
  ('tesis', 'Tesis', 2),
  ('encuadernacion', 'Encuadernación', 3),
  ('carteleria', 'Cartelería', 4),
  ('placas', 'Placas', 5),
  ('calcos', 'Calcos', 6),
  ('folleteria', 'Folletería', 7),
  ('ploteo', 'Ploteo', 8)
ON CONFLICT (name) DO NOTHING;

-- Step 3: Convert orders.service_type from enum to text
-- First, add a temporary column
DO $$ 
BEGIN
  -- Add temporary text column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'service_type_temp'
  ) THEN
    ALTER TABLE orders ADD COLUMN service_type_temp TEXT;
  END IF;
END $$;

-- Copy data from enum to text
UPDATE orders SET service_type_temp = service_type::text WHERE service_type_temp IS NULL;

-- Drop the old enum column and rename temp
DO $$
BEGIN
  -- Drop old column if it exists and is an enum
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'service_type'
    AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE orders DROP COLUMN service_type;
  END IF;
  
  -- Rename temp column to service_type if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'service_type_temp'
  ) THEN
    ALTER TABLE orders RENAME COLUMN service_type_temp TO service_type;
  END IF;
  
  -- Make sure service_type is NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'service_type'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE orders ALTER COLUMN service_type SET NOT NULL;
  END IF;
END $$;

-- Step 4: Update service_materials table to use text instead of enum
DO $$
BEGIN
  -- Add temporary text column for service_materials
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_materials' AND column_name = 'service_type_temp'
  ) THEN
    ALTER TABLE service_materials ADD COLUMN service_type_temp TEXT;
  END IF;
END $$;

-- Copy data
UPDATE service_materials SET service_type_temp = service_type::text WHERE service_type_temp IS NULL;

-- Drop and rename
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_materials' 
    AND column_name = 'service_type'
    AND data_type = 'USER-DEFINED'
  ) THEN
    ALTER TABLE service_materials DROP COLUMN service_type;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_materials' AND column_name = 'service_type_temp'
  ) THEN
    ALTER TABLE service_materials RENAME COLUMN service_type_temp TO service_type;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_materials' 
    AND column_name = 'service_type'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE service_materials ALTER COLUMN service_type SET NOT NULL;
  END IF;
END $$;

-- Step 5: Update quotes table to use text instead of enum (if service_type column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotes' AND column_name = 'service_type'
  ) THEN
    -- Add temporary text column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'quotes' AND column_name = 'service_type_temp'
    ) THEN
      ALTER TABLE quotes ADD COLUMN service_type_temp TEXT;
    END IF;
    
    -- Copy data
    UPDATE quotes SET service_type_temp = service_type::text WHERE service_type_temp IS NULL;
    
    -- Drop and rename
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'quotes' 
      AND column_name = 'service_type'
      AND data_type = 'USER-DEFINED'
    ) THEN
      ALTER TABLE quotes DROP COLUMN service_type;
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'quotes' AND column_name = 'service_type_temp'
    ) THEN
      ALTER TABLE quotes RENAME COLUMN service_type_temp TO service_type;
    END IF;
  END IF;
END $$;

-- Step 6: Create index on services.name for faster lookups
CREATE INDEX IF NOT EXISTS idx_services_name ON services(name);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- Step 7: Add index on orders.service_type for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_service_type ON orders(service_type);
