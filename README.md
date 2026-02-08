# AdminBlock

Sistema de gestión para imprenta familiar — pedidos, clientes, cotizaciones, facturación y reportes.

## Tech Stack

- **Next.js 16** - App Router, Server Components, React 19
- **Supabase** - Auth + Postgres database
- **Drizzle ORM** - Type-safe database access
- **TanStack Query** - Data fetching & caching
- **TanStack Table** - Tables with sort/filter
- **Zustand** - UI state management
- **shadcn/ui + Radix UI** - Accessible UI components
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons
- **Sonner** - Toast notifications
- **Zod** - Input validation & sanitization
- **xlsx** - Excel export
- **dayjs** - Date formatting
- **Twilio** - WhatsApp notifications (optional)

## Features

- **Pedidos** — CRUD, estados (pendiente → cotizado → aprobado → en proceso → listo → entregado), archivado, duplicar
- **Clientes** — Personas y empresas, vínculos empresa↔persona, toggle/filtro por tipo
- **Cotizador** — Líneas de materiales/servicios, tercerizados, margen de ganancia, crear pedido desde cotización
- **Facturación** — Factura A (IVA 21%), Factura B/C, campos en pedidos (subtotal, IVA, nro factura)
- **Reportes mensuales** — Ventas por factura, gastos manuales + materiales, balance
- **Pagos** — Parciales/totales, comprobantes, estados
- **Materiales y proveedores** — Catálogo, precios por proveedor, asignación a servicios
- **Servicios dinámicos** — Configurables desde UI (sin hardcodear)
- **WhatsApp** — Botones con mensaje pre-armado, notificaciones automáticas (Twilio)
- **Excel export** — Pedidos por mes/rango, lista de clientes

## Configuración

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto
2. En Project Settings > API, copia: Project URL + anon/public key
3. En Project Settings > Database, copia el connection string

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
DATABASE_URL=postgresql://postgres:TU-PASSWORD@db.tu-proyecto.supabase.co:5432/postgres
```

### 3. Base de datos

```bash
npm run db:push        # Push directo del schema (dev)
```

O con migraciones versionadas: `npm run db:generate` + `npm run db:migrate`

Las migraciones SQL están en `/migrations/` (001–011).

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
│   │   ├── orders/         # Pedidos
│   │   ├── clients/        # Clientes
│   │   ├── quotes/         # Cotizador
│   │   ├── reports/        # Reportes mensuales
│   │   └── settings/       # Ajustes (materiales, servicios, proveedores)
│   ├── api/                # API routes (REST)
│   └── login/              # Login
├── components/
│   ├── ui/                 # shadcn/ui (Button, Input, Dialog, etc.)
│   ├── layout/             # Sidebar, Header
│   ├── orders/             # Order list, edit modal, cards
│   ├── clients/            # Client list, edit modal, orders modal
│   ├── materials/          # Materials management
│   ├── services/           # Services management
│   ├── suppliers/          # Suppliers management
│   ├── providers/          # QueryProvider
│   └── *.tsx               # Error boundaries
├── lib/
│   ├── db/                 # Drizzle schema + connection
│   ├── supabase/           # Supabase clients (browser + server)
│   ├── validations/        # Zod schemas (orders, clients, relationships)
│   └── utils/              # Helpers (dates, export, invoice, messaging, validation)
├── stores/                 # Zustand stores (UI state)
└── hooks/                  # React Query hooks (clients, orders, quotes, etc.)
```

## Documentación

Ver `/docs/` para documentación completa:
- `MANUAL_USUARIO.txt` — Guía para usuarios finales
- `BUSINESS_UNDERSTANDING.txt` — Contexto del negocio
- `improvements.txt` — Roadmap de mejoras pendientes
