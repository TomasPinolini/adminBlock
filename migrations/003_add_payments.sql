-- Add payment status enum
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid');

-- Add payment fields to orders table
ALTER TABLE orders
ADD COLUMN payment_status payment_status NOT NULL DEFAULT 'pending',
ADD COLUMN payment_amount NUMERIC(10, 2),
ADD COLUMN receipt_url TEXT,
ADD COLUMN paid_at TIMESTAMP;

-- Add payment_registered to activity_type enum
ALTER TYPE activity_type ADD VALUE 'payment_registered';

-- Create storage bucket for receipts (run this in Supabase Dashboard > Storage)
-- 1. Create a new bucket called "receipts"
-- 2. Make it public or set up RLS policies as needed
