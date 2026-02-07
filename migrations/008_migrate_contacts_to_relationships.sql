-- Migration: Migrate contacts to clientRelationships
-- Description: Consolidate duplicate client system by migrating contacts to clientRelationships
-- Date: 2026-02-06

-- Step 1: Migrate existing contacts to clientRelationships
-- Only migrate if there are contacts that don't already exist in clientRelationships
INSERT INTO client_relationships (person_id, company_id, role, notes, created_at, updated_at)
SELECT 
    c.id as person_id,
    c.client_id as company_id,
    COALESCE(c.role, 'Contacto') as role,
    c.notes,
    c.created_at,
    c.updated_at
FROM contacts c
WHERE NOT EXISTS (
    SELECT 1 FROM client_relationships cr
    WHERE cr.person_id = c.id AND cr.company_id = c.client_id
);

-- Step 2: Update orders.contact_id to use orders.person_id instead
-- Find the person_id from contacts and set it in orders.person_id
UPDATE orders o
SET person_id = c.id
FROM contacts c
WHERE o.contact_id = c.id
  AND o.person_id IS NULL;

-- Step 3: Drop the contact_id column from orders (no longer needed)
ALTER TABLE orders DROP COLUMN IF EXISTS contact_id;

-- Step 4: Drop the contacts table
DROP TABLE IF EXISTS contacts CASCADE;

-- Verify the migration
SELECT 
    'client_relationships' as table_name,
    COUNT(*) as record_count
FROM client_relationships
UNION ALL
SELECT 
    'orders_with_person' as table_name,
    COUNT(*) as record_count
FROM orders
WHERE person_id IS NOT NULL;
