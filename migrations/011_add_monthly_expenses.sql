-- Migration: Add monthly_expenses table for tracking monthly business expenses
-- This table stores expense entries organized by year/month, used in the Reportes page

CREATE TABLE IF NOT EXISTS monthly_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast monthly lookups
CREATE INDEX IF NOT EXISTS idx_monthly_expenses_year_month ON monthly_expenses (year, month);

-- Enable RLS
ALTER TABLE monthly_expenses ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Authenticated users can manage monthly_expenses"
  ON monthly_expenses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
