-- =============================================
-- ADMINBLOCK - SEED DATA PARA TESTING
-- Pegar en Supabase SQL Editor y ejecutar
-- =============================================
-- IMPORTANTE: Ejecutar cada bloque por separado si falla alguno.
-- Los IDs son fijos para poder referenciar entre tablas.

-- =============================================
-- 0. BORRAR TODOS LOS DATOS EXISTENTES
-- Ejecutar esto PRIMERO y POR SEPARADO
-- =============================================
TRUNCATE TABLE
  order_materials,
  order_comments,
  order_attachments,
  quote_materials,
  quotes,
  orders,
  client_relationships,
  clients,
  supplier_materials,
  suppliers,
  service_materials,
  service_prices,
  services,
  materials,
  monthly_expenses,
  activity_logs,
  app_settings
CASCADE;

-- =============================================
-- 1. SERVICIOS (ON CONFLICT para no duplicar)
-- =============================================
INSERT INTO services (id, name, display_name, description, is_active, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'fotocopias', 'Fotocopias', 'Fotocopias blanco y negro / color', true, 1),
  ('a0000000-0000-0000-0000-000000000002', 'impresion', 'Impresion', 'Impresion digital y offset', true, 2),
  ('a0000000-0000-0000-0000-000000000003', 'encuadernacion', 'Encuadernacion', 'Anillado, encolado, tapa dura', true, 3),
  ('a0000000-0000-0000-0000-000000000004', 'plotter', 'Plotter', 'Impresion gran formato, planos, banners', true, 4),
  ('a0000000-0000-0000-0000-000000000005', 'tesis', 'Tesis', 'Impresion y encuadernacion de tesis', true, 5),
  ('a0000000-0000-0000-0000-000000000006', 'sellos', 'Sellos', 'Sellos de goma y autoentintables', true, 6),
  ('a0000000-0000-0000-0000-000000000007', 'tarjetas', 'Tarjetas', 'Tarjetas personales y comerciales', true, 7),
  ('a0000000-0000-0000-0000-000000000008', 'laminado', 'Laminado', 'Plastificado y laminado', true, 8),
  ('a0000000-0000-0000-0000-000000000009', 'stickers', 'Stickers', 'Stickers y etiquetas adhesivas', true, 9),
  ('a0000000-0000-0000-0000-000000000010', 'diseno', 'Diseno', 'Diseno grafico', true, 10)
ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name, sort_order = EXCLUDED.sort_order;

-- =============================================
-- 2. MATERIALES
-- =============================================
INSERT INTO materials (id, name, unit, notes, is_active) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Resma A4 75g', 'resma', 'Papel comun A4', true),
  ('b0000000-0000-0000-0000-000000000002', 'Resma A4 80g', 'resma', 'Papel premium A4', true),
  ('b0000000-0000-0000-0000-000000000003', 'Resma A3 75g', 'resma', 'Papel A3 comun', true),
  ('b0000000-0000-0000-0000-000000000004', 'Resma Oficio 75g', 'resma', 'Papel oficio', true),
  ('b0000000-0000-0000-0000-000000000005', 'Toner HP CF258A', 'unidad', 'Toner para HP LaserJet Pro', true),
  ('b0000000-0000-0000-0000-000000000006', 'Toner HP CF226X', 'unidad', 'Toner alto rendimiento', true),
  ('b0000000-0000-0000-0000-000000000007', 'Toner Color HP', 'unidad', 'Set CMYK para HP Color', true),
  ('b0000000-0000-0000-0000-000000000008', 'Anillo plastico 14mm', 'unidad', 'Anillo para encuadernacion', true),
  ('b0000000-0000-0000-0000-000000000009', 'Anillo plastico 25mm', 'unidad', 'Anillo grande', true),
  ('b0000000-0000-0000-0000-000000000010', 'Tapa PVC transparente', 'unidad', 'Tapa cristal A4', true),
  ('b0000000-0000-0000-0000-000000000011', 'Tapa carton negra A4', 'unidad', 'Contra-tapa', true),
  ('b0000000-0000-0000-0000-000000000012', 'Rollo plotter 90g 61cm', 'rollo', 'Rollo plotter 50m', true),
  ('b0000000-0000-0000-0000-000000000013', 'Rollo plotter 90g 91cm', 'rollo', 'Rollo plotter ancho', true),
  ('b0000000-0000-0000-0000-000000000014', 'Vinilo adhesivo blanco', 'metro', 'Para stickers', true),
  ('b0000000-0000-0000-0000-000000000015', 'Laminado frio brillante', 'metro', 'Film protector', true),
  ('b0000000-0000-0000-0000-000000000016', 'Goma para sellos', 'plancha', 'Plancha de goma microporo', true),
  ('b0000000-0000-0000-0000-000000000017', 'Carton gris 2mm', 'plancha', 'Para tapas duras', true),
  ('b0000000-0000-0000-0000-000000000018', 'Cola vinilica', 'litro', 'Adhesivo para encuadernacion', true)
ON CONFLICT DO NOTHING;

-- =============================================
-- 3. PROVEEDORES
-- =============================================
INSERT INTO suppliers (id, name, phone, address, notes, is_active) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Distribuidora Pampa', '3424551234', 'Av. Freyre 2500, Santa Fe', 'Proveedor principal de papel', true),
  ('c0000000-0000-0000-0000-000000000002', 'Toner Express SF', '3424889900', 'Bv. Galvez 1200, Santa Fe', 'Toner originales y alternativos', true),
  ('c0000000-0000-0000-0000-000000000003', 'Grafica del Litoral', '3424776655', 'Calle San Martin 800, Santa Fe', 'Encuadernacion e insumos graficos', true),
  ('c0000000-0000-0000-0000-000000000004', 'MegaPrint Rosario', '3415443322', 'Av. Pellegrini 3400, Rosario', 'Rollos plotter y vinilos', true),
  ('c0000000-0000-0000-0000-000000000005', 'Sellos Santafesinos', '3424332211', 'Calle 25 de Mayo 1500, Santa Fe', 'Gomas y bases para sellos', true)
ON CONFLICT DO NOTHING;

-- =============================================
-- 4. PRECIOS DE PROVEEDORES (supplier_materials)
-- =============================================
INSERT INTO supplier_materials (id, supplier_id, material_id, current_price, notes) VALUES
  -- Distribuidora Pampa (papel)
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '5200.00', 'Precio por resma'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', '6100.00', null),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', '9800.00', null),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', '5500.00', null),
  -- Toner Express (toner)
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', '18500.00', 'Original HP'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006', '24000.00', 'Alto rendimiento'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000007', '35000.00', 'Set 4 colores'),
  -- Grafica del Litoral (encuadernacion)
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000008', '120.00', 'Precio unitario'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000009', '180.00', null),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000010', '250.00', null),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000011', '200.00', null),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000017', '3800.00', 'Plancha 70x100'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000018', '2200.00', 'Bidon 5L'),
  -- MegaPrint Rosario (plotter + vinilo)
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000012', '28000.00', 'Rollo 50m'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000013', '42000.00', 'Rollo 50m ancho'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000014', '3500.00', 'Precio por metro'),
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000015', '2800.00', 'Precio por metro'),
  -- Sellos Santafesinos
  (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000016', '4500.00', 'Plancha A4')
ON CONFLICT DO NOTHING;

-- =============================================
-- 5. CLIENTES (personas + empresas)
-- =============================================
INSERT INTO clients (id, client_type, name, phone, email, cuit, notes) VALUES
  -- Empresas
  ('d0000000-0000-0000-0000-000000000001', 'company', 'Estudio Juridico Fernandez & Asoc.', '3424551100', 'estudio@fernandezasoc.com.ar', '30-71234567-8', 'Cliente frecuente, facturas A'),
  ('d0000000-0000-0000-0000-000000000002', 'company', 'Constructora Del Rio SRL', '3424889900', 'admin@constructoradelrio.com', '30-70987654-3', 'Planos y documentacion'),
  ('d0000000-0000-0000-0000-000000000003', 'company', 'Municipalidad de Santa Fe', '3424571000', 'compras@santafe.gob.ar', '30-99999999-0', 'Licitaciones, piden factura A'),
  ('d0000000-0000-0000-0000-000000000004', 'company', 'Clinica San Martin', '3424667788', 'admin@clinicasanmartin.com.ar', '30-70111222-5', 'Formularios y folletos'),
  ('d0000000-0000-0000-0000-000000000005', 'company', 'Inmobiliaria Costa', '3424998877', 'info@inmobiliariacosta.com.ar', '20-28765432-1', 'Folleteria mensual'),
  -- Personas
  ('d0000000-0000-0000-0000-000000000006', 'individual', 'Maria Laura Gonzalez', '3424112233', 'mlaura.gonzalez@gmail.com', null, 'Estudiante de abogacia, tesis'),
  ('d0000000-0000-0000-0000-000000000007', 'individual', 'Carlos Alberto Pereyra', '3424334455', 'cpereyra@estudiocontable.com', '20-18234567-9', 'Contador, trae trabajo de sus clientes'),
  ('d0000000-0000-0000-0000-000000000008', 'individual', 'Ana Lucia Martinez', '3424556677', 'ana.martinez.diseno@gmail.com', null, 'Diseno grafico freelance'),
  ('d0000000-0000-0000-0000-000000000009', 'individual', 'Roberto Sanchez', '3424778899', null, null, 'Jubilado, fotocopias personales'),
  ('d0000000-0000-0000-0000-000000000010', 'individual', 'Sofia Ramirez', '3424990011', 'sofi.ramirez@hotmail.com', null, 'Profesora, muchas fotocopias'),
  ('d0000000-0000-0000-0000-000000000011', 'individual', 'Pablo Gutierrez', '3424223344', 'pgutierrez.arq@gmail.com', '20-32456789-0', 'Arquitecto, planos'),
  ('d0000000-0000-0000-0000-000000000012', 'individual', 'Valentina Romero', '3424445566', 'vale.romero@outlook.com', null, 'Estudiante de medicina'),
  ('d0000000-0000-0000-0000-000000000013', 'individual', 'Jorge Luis Acosta', '3424667788', null, '20-22334455-7', 'Agrimensor'),
  ('d0000000-0000-0000-0000-000000000014', 'individual', 'Claudia Vega', '3424889911', 'claudia.vega@gmail.com', null, 'Emprendedora, stickers'),
  ('d0000000-0000-0000-0000-000000000015', 'individual', 'Martin Perez', '3424112244', null, null, 'Estudiante ingenieria')
ON CONFLICT DO NOTHING;

-- =============================================
-- 6. RELACIONES PERSONA-EMPRESA
-- =============================================
INSERT INTO client_relationships (id, person_id, company_id, role, notes) VALUES
  (gen_random_uuid(), 'd0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000001', 'Contador externo', 'Trae trabajo del estudio'),
  (gen_random_uuid(), 'd0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000002', 'Arquitecto', 'Planos de obras'),
  (gen_random_uuid(), 'd0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000002', 'Agrimensor', 'Relevamientos')
ON CONFLICT DO NOTHING;

-- =============================================
-- 7. PEDIDOS - ENERO 2026
-- =============================================
INSERT INTO orders (id, client_id, service_type, status, description, price, due_date, invoice_number, invoice_type, quantity, subtotal, tax_amount, payment_status, payment_amount, is_archived, created_at, updated_at) VALUES
  -- Enero - Entregados y archivados (pagados)
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'fotocopias', 'delivered', '500 copias contrato, doble faz', '15000.00', '2026-01-10', '3050', 'A', '500', '12396.69', '2603.31', 'paid', '15000.00', true, '2026-01-06 09:30:00', '2026-01-10 14:00:00'),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000006', 'tesis', 'delivered', 'Tesis abogacia, 3 ejemplares tapa dura', '45000.00', '2026-01-15', null, 'none', '3', null, null, 'paid', '45000.00', true, '2026-01-08 11:00:00', '2026-01-15 16:30:00'),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'plotter', 'delivered', 'Planos obra Av. Galvez, 8 laminas A1', '32000.00', '2026-01-12', '3051', 'A', '8', '26446.28', '5553.72', 'paid', '32000.00', true, '2026-01-09 08:15:00', '2026-01-12 13:00:00'),
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000010', 'fotocopias', 'delivered', 'Material didactico, 200 copias x 30 alumnos', '28000.00', '2026-01-14', null, 'none', '6000', null, null, 'paid', '28000.00', true, '2026-01-10 10:00:00', '2026-01-14 12:00:00'),
  ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000003', 'impresion', 'delivered', 'Folletos campaña vacunacion, 2000 unidades', '85000.00', '2026-01-20', '3052', 'A', '2000', '70247.93', '14752.07', 'paid', '85000.00', true, '2026-01-13 14:30:00', '2026-01-20 11:00:00'),
  ('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000014', 'stickers', 'delivered', 'Stickers troquelados para emprendimiento, 500u', '18000.00', '2026-01-18', null, 'none', '500', null, null, 'paid', '18000.00', true, '2026-01-14 09:00:00', '2026-01-18 15:00:00'),
  ('e0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000004', 'impresion', 'delivered', 'Formularios recetarios 10 blocks x 100', '22000.00', '2026-01-22', '3053', 'A', '1000', '18181.82', '3818.18', 'paid', '22000.00', true, '2026-01-16 08:45:00', '2026-01-22 10:30:00'),
  ('e0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000005', 'tarjetas', 'delivered', '1000 tarjetas personales doble faz', '12000.00', '2026-01-23', null, 'none', '1000', null, null, 'paid', '12000.00', true, '2026-01-17 11:30:00', '2026-01-23 09:00:00'),
  ('e0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000009', 'fotocopias', 'delivered', 'Documentos personales, DNI, escrituras', '2500.00', '2026-01-17', null, 'none', '25', null, null, 'paid', '2500.00', true, '2026-01-17 15:00:00', '2026-01-17 15:30:00'),
  ('e0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000008', 'diseno', 'delivered', 'Logo + papeleria para cliente Ana', '35000.00', '2026-01-25', null, 'none', '1', null, null, 'paid', '35000.00', true, '2026-01-20 10:00:00', '2026-01-25 16:00:00'),

  -- Enero - Entregados pago parcial
  ('e0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000007', 'impresion', 'delivered', 'Carpetas presentacion con logo, 200u', '48000.00', '2026-01-28', '3054', 'A', '200', '39669.42', '8330.58', 'partial', '30000.00', false, '2026-01-22 09:30:00', '2026-01-28 14:00:00'),

-- =============================================
-- 8. PEDIDOS - FEBRERO 2026
-- =============================================
  -- Febrero - Activos en progreso
  ('e0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000001', 'fotocopias', 'in_progress', '800 copias expediente judicial', '22000.00', '2026-02-10', '3055', 'A', '800', '18181.82', '3818.18', 'pending', null, false, '2026-02-03 09:00:00', '2026-02-05 10:00:00'),
  ('e0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000012', 'tesis', 'in_progress', 'Tesis medicina, 2 ejemplares anillados + 1 tapa dura', '38000.00', '2026-02-14', null, 'none', '3', null, null, 'pending', null, false, '2026-02-04 11:00:00', '2026-02-05 14:00:00'),
  ('e0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000003', 'plotter', 'in_progress', 'Banners evento deportivo municipal, 5 de 3x1m', '65000.00', '2026-02-12', '3056', 'A', '5', '53719.01', '11280.99', 'pending', null, false, '2026-02-05 08:00:00', '2026-02-06 09:00:00'),

  -- Febrero - Listos para retirar
  ('e0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000010', 'fotocopias', 'ready', 'Examenes parciales, 150 copias x 3 materias', '12000.00', '2026-02-07', null, 'none', '450', null, null, 'pending', null, false, '2026-02-03 14:00:00', '2026-02-06 16:00:00'),
  ('e0000000-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000005', 'impresion', 'ready', 'Folletos propiedades mes febrero, 500u', '18000.00', '2026-02-08', null, 'none', '500', null, null, 'paid', '18000.00', false, '2026-02-04 10:30:00', '2026-02-07 11:00:00'),
  ('e0000000-0000-0000-0000-000000000017', 'd0000000-0000-0000-0000-000000000014', 'stickers', 'ready', 'Nuevos stickers redondos 5cm, 300u', '9500.00', '2026-02-08', null, 'none', '300', null, null, 'pending', null, false, '2026-02-05 09:30:00', '2026-02-07 15:00:00'),

  -- Febrero - Cotizados esperando aprobacion
  ('e0000000-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000002', 'plotter', 'quoted', 'Planos nueva obra barrio sur, 12 laminas', '48000.00', '2026-02-15', null, 'none', '12', null, null, 'pending', null, false, '2026-02-06 08:30:00', '2026-02-06 10:00:00'),
  ('e0000000-0000-0000-0000-000000000019', 'd0000000-0000-0000-0000-000000000004', 'impresion', 'quoted', 'Folletos nueva especialidad, 3000u color', '120000.00', '2026-02-20', '3057', 'A', '3000', '99173.55', '20826.45', 'pending', null, false, '2026-02-06 11:00:00', '2026-02-07 09:00:00'),

  -- Febrero - Pendientes de cotizar
  ('e0000000-0000-0000-0000-000000000020', 'd0000000-0000-0000-0000-000000000015', 'encuadernacion', 'pending_quote', 'Trabajo practico ingenieria, 5 ejemplares anillados', null, '2026-02-12', null, 'none', '5', null, null, 'pending', null, false, '2026-02-07 08:00:00', '2026-02-07 08:00:00'),
  ('e0000000-0000-0000-0000-000000000021', 'd0000000-0000-0000-0000-000000000011', 'plotter', 'pending_quote', 'Render 3D para presentacion, formato A0', null, '2026-02-14', null, 'none', '2', null, null, 'pending', null, false, '2026-02-07 09:15:00', '2026-02-07 09:15:00'),
  ('e0000000-0000-0000-0000-000000000022', 'd0000000-0000-0000-0000-000000000008', 'diseno', 'pending_quote', 'Rediseno menu restaurante cliente', null, '2026-02-18', null, 'none', '1', null, null, 'pending', null, false, '2026-02-07 10:00:00', '2026-02-07 10:00:00'),

  -- Febrero - Entregado (pagado)
  ('e0000000-0000-0000-0000-000000000023', 'd0000000-0000-0000-0000-000000000009', 'fotocopias', 'delivered', 'Fotocopias varias', '1800.00', '2026-02-03', null, 'none', '18', null, null, 'paid', '1800.00', false, '2026-02-03 16:00:00', '2026-02-03 16:30:00'),
  ('e0000000-0000-0000-0000-000000000024', 'd0000000-0000-0000-0000-000000000013', 'plotter', 'delivered', 'Plano lote zona norte', '8500.00', '2026-02-05', null, 'none', '1', null, null, 'paid', '8500.00', false, '2026-02-04 08:00:00', '2026-02-05 12:00:00'),

  -- Febrero - Sellos
  ('e0000000-0000-0000-0000-000000000025', 'd0000000-0000-0000-0000-000000000007', 'sellos', 'ready', 'Sello autoentintable rectangular, datos contador', '8500.00', '2026-02-08', null, 'none', '1', null, null, 'pending', null, false, '2026-02-05 14:00:00', '2026-02-07 10:00:00'),

  -- Pedido cancelado
  ('e0000000-0000-0000-0000-000000000026', 'd0000000-0000-0000-0000-000000000015', 'impresion', 'cancelled', 'CV color 50 copias - cancelo el alumno', '5000.00', null, null, 'none', '50', null, null, 'pending', null, false, '2026-02-02 10:00:00', '2026-02-03 08:00:00')
ON CONFLICT DO NOTHING;

-- =============================================
-- 9. COTIZACIONES
-- =============================================
INSERT INTO quotes (id, client_id, service_type, description, materials_cost, profit_margin, profit_type, total_price, is_outsourced, outsourced_supplier_id, created_at, updated_at) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'plotter', 'Planos obra Av. Galvez', '18000.00', '14000.00', 'fixed', '32000.00', false, null, '2026-01-08 15:00:00', '2026-01-08 15:00:00'),
  ('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', 'impresion', 'Folletos vacunacion 2000u', '42000.00', '100', 'percentage', '84000.00', false, null, '2026-01-12 10:00:00', '2026-01-12 10:00:00'),
  ('f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000014', 'stickers', 'Stickers troquelados 500u', '8500.00', '9500.00', 'fixed', '18000.00', false, null, '2026-01-13 16:00:00', '2026-01-13 16:00:00'),
  ('f0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'impresion', 'Folletos nueva especialidad 3000u', '55000.00', '65000.00', 'fixed', '120000.00', false, null, '2026-02-05 14:00:00', '2026-02-05 14:00:00'),
  -- Cotizacion tercerizada
  ('f0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000006', 'encuadernacion', 'Tesis tapa dura 3 ejemplares', '25000.00', '20000.00', 'fixed', '45000.00', true, 'c0000000-0000-0000-0000-000000000003', '2026-01-07 11:00:00', '2026-01-07 11:00:00'),
  ('f0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000005', 'tarjetas', 'Tarjetas personales 1000u', '5000.00', '7000.00', 'fixed', '12000.00', true, 'c0000000-0000-0000-0000-000000000003', '2026-01-16 09:00:00', '2026-01-16 09:00:00')
ON CONFLICT DO NOTHING;

-- =============================================
-- 10. LINEAS DE COTIZACION (quote_materials)
-- =============================================
INSERT INTO quote_materials (id, quote_id, line_type, material_id, description, supplier_id, quantity, unit_price, subtotal) VALUES
  -- Cotizacion planos (f...001)
  (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000001', 'material', 'b0000000-0000-0000-0000-000000000013', null, 'c0000000-0000-0000-0000-000000000004', '2', '6000.00', '12000.00'),
  (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000001', 'service', null, 'Impresion plotter A1 x8', null, '8', '750.00', '6000.00'),
  -- Cotizacion folletos muni (f...002)
  (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000002', 'material', 'b0000000-0000-0000-0000-000000000001', null, 'c0000000-0000-0000-0000-000000000001', '4', '5200.00', '20800.00'),
  (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000002', 'material', 'b0000000-0000-0000-0000-000000000007', null, 'c0000000-0000-0000-0000-000000000002', '1', '35000.00', '35000.00'),
  -- Cotizacion stickers (f...003)
  (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000003', 'material', 'b0000000-0000-0000-0000-000000000014', null, 'c0000000-0000-0000-0000-000000000004', '2', '3500.00', '7000.00'),
  (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000003', 'material', 'b0000000-0000-0000-0000-000000000015', null, 'c0000000-0000-0000-0000-000000000004', '0.5', '2800.00', '1400.00'),
  -- Cotizacion clinica (f...004)
  (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000004', 'material', 'b0000000-0000-0000-0000-000000000001', null, 'c0000000-0000-0000-0000-000000000001', '6', '5200.00', '31200.00'),
  (gen_random_uuid(), 'f0000000-0000-0000-0000-000000000004', 'material', 'b0000000-0000-0000-0000-000000000007', null, 'c0000000-0000-0000-0000-000000000002', '1', '35000.00', '35000.00')
ON CONFLICT DO NOTHING;

-- =============================================
-- 11. GASTOS MENSUALES
-- =============================================
INSERT INTO monthly_expenses (id, year, month, category, description, amount) VALUES
  -- Enero 2026
  (gen_random_uuid(), 2026, 1, 'ALQUILER', 'Local calle San Martin', '180000.00'),
  (gen_random_uuid(), 2026, 1, 'EPE', 'Luz enero', '35000.00'),
  (gen_random_uuid(), 2026, 1, 'AGUAS', 'Agua enero', '8500.00'),
  (gen_random_uuid(), 2026, 1, 'INTERNET', 'Fibertel', '18000.00'),
  (gen_random_uuid(), 2026, 1, 'MONOTRIBUTO', 'Categoria E', '42000.00'),
  (gen_random_uuid(), 2026, 1, 'SEGURO', 'Seguro local', '15000.00'),
  (gen_random_uuid(), 2026, 1, 'MANTENIMIENTO', 'Service impresora HP', '25000.00'),
  -- Febrero 2026
  (gen_random_uuid(), 2026, 2, 'ALQUILER', 'Local calle San Martin', '180000.00'),
  (gen_random_uuid(), 2026, 2, 'EPE', 'Luz febrero', '38000.00'),
  (gen_random_uuid(), 2026, 2, 'AGUAS', 'Agua febrero', '8500.00'),
  (gen_random_uuid(), 2026, 2, 'INTERNET', 'Fibertel', '18000.00'),
  (gen_random_uuid(), 2026, 2, 'MONOTRIBUTO', 'Categoria E', '42000.00'),
  (gen_random_uuid(), 2026, 2, 'SEGURO', 'Seguro local', '15000.00'),
  (gen_random_uuid(), 2026, 2, 'LIMPIEZA', 'Productos limpieza', '5500.00')
ON CONFLICT DO NOTHING;

-- =============================================
-- 12. MATERIALES USADOS EN PEDIDOS (order_materials)
-- Solo para algunos pedidos que tuvieron cotizacion previa
-- =============================================
INSERT INTO order_materials (id, order_id, line_type, material_id, description, supplier_id, quantity, unit_price, subtotal) VALUES
  -- Pedido planos Constructora (e...003)
  (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000003', 'material', 'b0000000-0000-0000-0000-000000000013', null, 'c0000000-0000-0000-0000-000000000004', '2', '6000.00', '12000.00'),
  (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000003', 'service', null, 'Impresion plotter A1 x8', null, '8', '750.00', '6000.00'),
  -- Pedido folletos Muni (e...005)
  (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000005', 'material', 'b0000000-0000-0000-0000-000000000001', null, 'c0000000-0000-0000-0000-000000000001', '4', '5200.00', '20800.00'),
  (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000005', 'material', 'b0000000-0000-0000-0000-000000000007', null, 'c0000000-0000-0000-0000-000000000002', '1', '35000.00', '35000.00'),
  -- Pedido stickers Claudia (e...006)
  (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000006', 'material', 'b0000000-0000-0000-0000-000000000014', null, 'c0000000-0000-0000-0000-000000000004', '2', '3500.00', '7000.00'),
  (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000006', 'material', 'b0000000-0000-0000-0000-000000000015', null, 'c0000000-0000-0000-0000-000000000004', '0.5', '2800.00', '1400.00'),
  -- Pedido fotocopias profe Sofia (e...004) - consumo de toner y papel
  (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000004', 'material', 'b0000000-0000-0000-0000-000000000001', null, 'c0000000-0000-0000-0000-000000000001', '12', '5200.00', '62400.00'),
  -- Pedido banners muni (e...014)
  (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000014', 'material', 'b0000000-0000-0000-0000-000000000014', null, 'c0000000-0000-0000-0000-000000000004', '15', '3500.00', '52500.00'),
  (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000014', 'material', 'b0000000-0000-0000-0000-000000000015', null, 'c0000000-0000-0000-0000-000000000004', '15', '2800.00', '42000.00')
ON CONFLICT DO NOTHING;

-- =============================================
-- LISTO! Verificar con:
-- SELECT 'services' as tabla, count(*) FROM services
-- UNION ALL SELECT 'materials', count(*) FROM materials
-- UNION ALL SELECT 'suppliers', count(*) FROM suppliers
-- UNION ALL SELECT 'clients', count(*) FROM clients
-- UNION ALL SELECT 'orders', count(*) FROM orders
-- UNION ALL SELECT 'quotes', count(*) FROM quotes
-- UNION ALL SELECT 'monthly_expenses', count(*) FROM monthly_expenses
-- UNION ALL SELECT 'order_materials', count(*) FROM order_materials;
-- =============================================
