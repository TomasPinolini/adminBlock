-- =============================================================================
-- RESET DATA: Vaciar la base de datos de AdminBlock
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================================
--
-- CUIDADO: Esto borra TODOS los datos. Las tablas y estructura quedan intactas.
-- Los servicios, materiales, proveedores y configuracion tambien se borran.
-- Solo se mantiene la estructura de tablas y los usuarios de auth.
--
-- =============================================================================

-- Desactivar temporalmente las restricciones de FK para borrar en cualquier orden
SET session_replication_role = 'replica';

-- Borrar datos en orden (hijos primero, padres despues)
TRUNCATE TABLE quote_materials CASCADE;
TRUNCATE TABLE order_materials CASCADE;
TRUNCATE TABLE order_comments CASCADE;
TRUNCATE TABLE order_attachments CASCADE;
TRUNCATE TABLE service_materials CASCADE;
TRUNCATE TABLE supplier_materials CASCADE;
TRUNCATE TABLE service_prices CASCADE;
TRUNCATE TABLE activity_logs CASCADE;
TRUNCATE TABLE monthly_expenses CASCADE;
TRUNCATE TABLE quotes CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE client_relationships CASCADE;
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE materials CASCADE;
TRUNCATE TABLE suppliers CASCADE;
TRUNCATE TABLE services CASCADE;
TRUNCATE TABLE app_settings CASCADE;

-- Reactivar restricciones de FK
SET session_replication_role = 'origin';

-- =============================================================================
-- LISTO! La base de datos esta vacia y lista para usar.
-- Las tablas, enums y estructura siguen intactas.
-- =============================================================================
