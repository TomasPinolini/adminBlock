# AdminBlock

Sistema de gestión para imprenta familiar — pedidos, clientes, cotizaciones, facturación, reportes y automatizaciones.

## Tech Stack

- **Next.js 16** - App Router, Server Components, React 19, React Compiler
- **Supabase** - Auth + Postgres database + Edge Functions + Storage
- **Drizzle ORM** - Type-safe database access
- **TanStack Query** - Data fetching & caching
- **TanStack Table** - Tables with sort/filter
- **Zustand** - UI state management
- **shadcn/ui + Radix UI** - Accessible UI components
- **Tailwind CSS 4** - Styling
- **Recharts** - Dashboard charts & analytics
- **jsPDF + AutoTable** - PDF generation (facturas, reportes)
- **Lucide React** - Icons
- **Sonner** - Toast notifications
- **Zod** - Input validation & sanitization
- **xlsx** - Excel export
- **dayjs** - Date formatting
- **Twilio** - WhatsApp notifications (optional)
- **Resend** - Email notifications via Supabase Edge Function (optional)
- **Mercado Pago** - Links de pago online (optional)

## Features

- **Pedidos** — CRUD, estados (pendiente → cotizado → aprobado → en proceso → listo → entregado), archivado, duplicar, metadata JSONB por servicio
- **Clientes** — Personas y empresas, vínculos empresa↔persona, dirección, toggle/filtro por tipo
- **Cotizador** — Líneas de materiales/servicios, tercerizados, margen de ganancia, crear pedido desde cotización
- **Termocopiados** — Página dedicada de carga rápida (libros, copias, precio), resumen diario, creación inline de clientes
- **Facturación** — Factura A (IVA 21%), B, C, Notas de Crédito/Débito (NC_C, ND_C), Recibos (R_C), variantes electrónicas (C_E, NC_C_E, ND_C_E), generación de PDF
- **Reportes y Dashboard** — Dashboard con KPIs, gráficos de ingresos vs gastos, pedidos mensuales, top clientes, top servicios. Reportes mensuales con ventas por factura, gastos manuales + materiales, balance
- **Pagos** — Parciales/totales, comprobantes, estados (pendiente/parcial/pagado), links de Mercado Pago
- **Materiales y proveedores** — Catálogo, precios por proveedor, asignación a servicios
- **Servicios dinámicos** — Configurables desde UI (sin hardcodear)
- **WhatsApp** — Botones con mensaje pre-armado, notificaciones automáticas (Twilio)
- **Email** — Plantillas para cotizaciones, pedido listo, en proceso, recordatorio de pago, agradecimiento (Resend)
- **Automatizaciones (cron)** — Auto-archivado de pedidos entregados+pagados (30 días), digest diario al admin, recordatorios de pedidos vencidos a clientes
- **Auditoría** — Log de actividad por pedido (creación, cambios de estado, pagos, comentarios)
- **Export** — Excel (pedidos por mes/rango, clientes), PDF (facturas, reportes mensuales), Libro IVA, backup JSON completo

## Configuración

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto
2. En Project Settings > API, copia: Project URL + anon/public key
3. En Project Settings > Database, copia el connection string

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Completar en `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` — URL del proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon/public key de Supabase
- `DATABASE_URL` — Connection string de Postgres (desde Supabase Dashboard)
- `NEXT_PUBLIC_BUSINESS_NAME` — Nombre del negocio (para PDFs)
- `NEXT_PUBLIC_BUSINESS_ADDRESS` — Dirección del negocio (para PDFs)
- `TWILIO_ACCOUNT_SID` / `TWILIO_API_KEY_SID` / `TWILIO_API_KEY_SECRET` / `TWILIO_WHATSAPP_FROM` — WhatsApp via Twilio (opcional)
- `RESEND_API_KEY` / `FROM_EMAIL` — Email via Resend Edge Function (opcional)
- `MERCADO_PAGO_ACCESS_TOKEN` — Pagos online (opcional)

### 3. Base de datos

```bash
npm run db:push        # Push directo del schema (dev)
```

O con migraciones versionadas: `npm run db:generate` + `npm run db:migrate`

Las migraciones SQL están en `/migrations/` (003–016).

### 4. Crear usuario

En Supabase Dashboard > Authentication > Users, crea un usuario con email y password.

### 5. Ejecutar

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Scripts

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # ESLint
npm run db:generate  # Genera migraciones Drizzle
npm run db:migrate   # Ejecuta migraciones
npm run db:push      # Push directo del schema
npm run db:studio    # Drizzle Studio (visual DB)
```

## Estructura del proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Rutas protegidas
│   │   ├── dashboard/      # Dashboard (KPIs, gráficos)
│   │   ├── orders/         # Pedidos
│   │   ├── clients/        # Clientes
│   │   ├── quotes/         # Cotizador
│   │   ├── reports/        # Reportes mensuales
│   │   ├── termocopiados/  # Carga rápida termocopiados
│   │   └── settings/       # Ajustes (materiales, servicios, proveedores)
│   ├── api/                # API routes (REST, 40+ endpoints)
│   └── login/              # Login
├── components/
│   ├── ui/                 # shadcn/ui (Button, Input, Dialog, etc.)
│   ├── layout/             # Sidebar, Header
│   ├── orders/             # Order list, edit modal, cards
│   ├── clients/            # Client list, edit modal, orders modal
│   ├── dashboard/          # KPI cards, charts (Recharts)
│   ├── termocopiados/      # Form, list, card, edit modal, quick client
│   ├── materials/          # Materials management
│   ├── services/           # Services management
│   ├── suppliers/          # Suppliers management
│   ├── providers/          # QueryProvider
│   └── *.tsx               # Error boundaries, email modal
├── lib/
│   ├── db/                 # Drizzle schema + connection
│   ├── supabase/           # Supabase clients (browser + server)
│   ├── validations/        # Zod schemas (orders, clients, relationships, termocopiados)
│   ├── utils/              # Helpers (dates, export, invoice, messaging, email, pdf, validation)
│   ├── activity.ts         # Activity/audit logging
│   ├── logger.ts           # API error logging
│   └── settings.ts         # App settings management
├── stores/                 # Zustand stores (UI state)
└── hooks/                  # React Query hooks (clients, orders, quotes, dashboard, etc.)
```

## Documentación

Ver `/docs/` para documentación completa:
- `MANUAL_USUARIO.txt` — Guía para usuarios finales
- `MANUAL_USUARIO.html` — Versión HTML del manual (abrir en navegador)
- `BUSINESS_UNDERSTANDING.txt` — Contexto del negocio
- `improvements.txt` — Roadmap de mejoras pendientes
- `info_automatizaciones.txt` — Guía de cron jobs y Edge Functions
- `code-review-fixes.md` — Registro de mejoras de calidad de código
- `seed-data.sql` — Datos de prueba para testing
