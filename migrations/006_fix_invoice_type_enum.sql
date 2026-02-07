-- Migration: Fix Invoice Type to use ENUM instead of TEXT
-- Description: Convert invoice_type column from TEXT to ENUM for type safety
-- Date: 2026-02-06

-- Step 1: Create the enum type (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE invoice_type AS ENUM ('A', 'B', 'none');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Convert the column to use the enum
-- First, ensure all existing values are valid (set invalid ones to 'none')
UPDATE orders 
SET invoice_type = 'none' 
WHERE invoice_type NOT IN ('A', 'B', 'none') 
   OR invoice_type IS NULL;

-- Step 3: Drop the existing default (TEXT default can't be cast to enum)
ALTER TABLE orders 
ALTER COLUMN invoice_type DROP DEFAULT;

-- Step 4: Alter the column to use the enum type
ALTER TABLE orders 
ALTER COLUMN invoice_type TYPE invoice_type 
USING invoice_type::invoice_type;

-- Step 5: Set new default value (now as enum)
ALTER TABLE orders 
ALTER COLUMN invoice_type SET DEFAULT 'none'::invoice_type;

-- Verify the change
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'invoice_type';
