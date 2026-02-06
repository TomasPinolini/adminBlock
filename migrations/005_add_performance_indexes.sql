-- Migration: Add Performance Indexes
-- Description: Add missing database indexes to improve query performance
-- Date: 2026-02-06

-- Add indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_due_date ON orders(due_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at);

-- Add indexes for clients table
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

-- Partial index for active orders (most common query pattern)
-- This index only includes non-completed orders, making it smaller and faster
CREATE INDEX IF NOT EXISTS idx_orders_active_status 
ON orders(status, created_at, due_date) 
WHERE status NOT IN ('delivered', 'cancelled');

-- Composite index for common filtering patterns
CREATE INDEX IF NOT EXISTS idx_orders_client_status 
ON orders(client_id, status, created_at);

-- Index for payment tracking queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_tracking 
ON orders(payment_status, due_date) 
WHERE payment_status != 'paid';

-- Index for archived orders filtering
CREATE INDEX IF NOT EXISTS idx_orders_archived_filter 
ON orders(is_archived, created_at) 
WHERE is_archived = 'false';

-- Analyze tables to update statistics after adding indexes
ANALYZE orders;
ANALYZE clients;
