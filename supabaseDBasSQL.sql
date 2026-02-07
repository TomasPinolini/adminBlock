-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  activity_type USER-DEFINED NOT NULL,
  user_id uuid,
  user_email text,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  description text NOT NULL,
  metadata text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.client_relationships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL,
  company_id uuid NOT NULL,
  role text,
  notes text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT client_relationships_pkey PRIMARY KEY (id),
  CONSTRAINT client_relationships_person_id_clients_id_fk FOREIGN KEY (person_id) REFERENCES public.clients(id),
  CONSTRAINT client_relationships_company_id_clients_id_fk FOREIGN KEY (company_id) REFERENCES public.clients(id)
);
CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  instagram_handle text,
  notes text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  client_type USER-DEFINED NOT NULL DEFAULT 'individual'::client_type,
  cuit text,
  CONSTRAINT clients_pkey PRIMARY KEY (id)
);
CREATE TABLE public.materials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text NOT NULL,
  notes text,
  is_active text NOT NULL DEFAULT 'true'::text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT materials_pkey PRIMARY KEY (id)
);
CREATE TABLE public.order_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_attachments_pkey PRIMARY KEY (id),
  CONSTRAINT order_attachments_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.order_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_comments_pkey PRIMARY KEY (id),
  CONSTRAINT order_comments_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.order_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  line_type text NOT NULL DEFAULT 'material'::text,
  material_id uuid,
  description text,
  supplier_id uuid,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  subtotal numeric NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_materials_pkey PRIMARY KEY (id),
  CONSTRAINT order_materials_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id),
  CONSTRAINT order_materials_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending_quote'::order_status,
  description text,
  price numeric,
  due_date date,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  payment_status USER-DEFINED NOT NULL DEFAULT 'pending'::payment_status,
  payment_amount numeric,
  receipt_url text,
  paid_at timestamp without time zone,
  person_id uuid,
  is_archived text NOT NULL DEFAULT 'false'::text,
  archived_at timestamp without time zone,
  invoice_number text,
  invoice_type USER-DEFINED DEFAULT 'none'::invoice_type,
  quantity numeric,
  subtotal numeric,
  tax_amount numeric,
  service_type text NOT NULL,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT orders_person_id_clients_id_fk FOREIGN KEY (person_id) REFERENCES public.clients(id)
);
CREATE TABLE public.quote_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL,
  line_type text NOT NULL DEFAULT 'material'::text,
  material_id uuid,
  description text,
  supplier_id uuid,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  subtotal numeric NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT quote_materials_pkey PRIMARY KEY (id),
  CONSTRAINT quote_materials_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id),
  CONSTRAINT quote_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id),
  CONSTRAINT quote_materials_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id)
);
CREATE TABLE public.quotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid,
  description text,
  materials_cost numeric,
  profit_margin numeric,
  profit_type text DEFAULT 'fixed'::text,
  total_price numeric,
  is_outsourced boolean NOT NULL DEFAULT false,
  outsourced_supplier_id uuid,
  order_id uuid,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  service_type text,
  CONSTRAINT quotes_pkey PRIMARY KEY (id),
  CONSTRAINT quotes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT quotes_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT quotes_outsourced_supplier_id_fkey FOREIGN KEY (outsourced_supplier_id) REFERENCES public.suppliers(id)
);
CREATE TABLE public.service_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL,
  default_quantity numeric,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  service_type text NOT NULL,
  CONSTRAINT service_materials_pkey PRIMARY KEY (id),
  CONSTRAINT service_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id)
);
CREATE TABLE public.service_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  variant_name text NOT NULL,
  base_price numeric,
  price_per_unit numeric,
  unit_type text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  service_type text NOT NULL,
  CONSTRAINT service_prices_pkey PRIMARY KEY (id)
);
CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  is_active text NOT NULL DEFAULT 'true'::text,
  sort_order numeric DEFAULT 0,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT services_pkey PRIMARY KEY (id)
);
CREATE TABLE public.supplier_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL,
  material_id uuid NOT NULL,
  current_price numeric,
  notes text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT supplier_materials_pkey PRIMARY KEY (id),
  CONSTRAINT supplier_materials_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id),
  CONSTRAINT supplier_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id)
);
CREATE TABLE public.suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  address text,
  notes text,
  is_active text NOT NULL DEFAULT 'true'::text,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT suppliers_pkey PRIMARY KEY (id)
);