-- Database Indexes for AdminBlock
-- Run these SQL commands to improve query performance

-- Orders table indexes
-- Frequently filtered by clientId, status, serviceType, and isArchived
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_service_type ON orders(service_type);
CREATE INDEX IF NOT EXISTS idx_orders_is_archived ON orders(is_archived);
CREATE INDEX IF NOT EXISTS idx_orders_due_date ON orders(due_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_orders_status_archived ON orders(status, is_archived);
CREATE INDEX IF NOT EXISTS idx_orders_service_archived ON orders(service_type, is_archived);

-- Clients table indexes
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- Client relationships indexes
CREATE INDEX IF NOT EXISTS idx_client_relationships_person ON client_relationships(person_id);
CREATE INDEX IF NOT EXISTS idx_client_relationships_company ON client_relationships(company_id);

-- Order materials indexes (for quotes and cost calculations)
CREATE INDEX IF NOT EXISTS idx_order_materials_order ON order_materials(order_id);
CREATE INDEX IF NOT EXISTS idx_order_materials_material ON order_materials(material_id);
CREATE INDEX IF NOT EXISTS idx_order_materials_supplier ON order_materials(supplier_id);

-- Quote materials indexes
CREATE INDEX IF NOT EXISTS idx_quote_materials_quote ON quote_materials(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_materials_material ON quote_materials(material_id);

-- Supplier materials indexes
CREATE INDEX IF NOT EXISTS idx_supplier_materials_supplier ON supplier_materials(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_materials_material ON supplier_materials(material_id);

-- Service materials indexes
CREATE INDEX IF NOT EXISTS idx_service_materials_service ON service_materials(service_type);
CREATE INDEX IF NOT EXISTS idx_service_materials_material ON service_materials(material_id);

-- Activity log indexes (for auditing)
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id ON activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Order comments indexes
CREATE INDEX IF NOT EXISTS idx_order_comments_order ON order_comments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_comments_created_at ON order_comments(created_at DESC);

-- Order attachments indexes
CREATE INDEX IF NOT EXISTS idx_order_attachments_order ON order_attachments(order_id);

-- Quotes indexes
CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_order ON quotes(order_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);

-- Performance notes:
-- - These indexes improve SELECT query performance
-- - They add slight overhead to INSERT/UPDATE/DELETE operations
-- - Monitor query performance and adjust as needed
-- - Use EXPLAIN ANALYZE to verify index usage in production queries
