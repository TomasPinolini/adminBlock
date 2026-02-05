# AdminBlock

Sistema de gestion para imprenta - Gestiona pedidos, clientes y cotizaciones.

## Tech Stack

- **Next.js 16** - App Router, Server Components
- **Supabase** - Auth + Postgres database
- **Drizzle ORM** - Type-safe database access
- **TanStack Query** - Data fetching & caching
- **TanStack Table** - Tables with sort/filter
- **Zustand** - UI state management
- **Radix UI** - Accessible components
- **Zod** - Validation
- **xlsx** - Excel export
- **dayjs** - Date formatting
- **Inngest** - Background jobs (coming soon)

## Configuracion

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto
2. En Project Settings > API, copia:
   - Project URL
   - anon/public key
3. En Project Settings > Database, copia el connection string

### 2. Configurar variables de entorno

Copia `.env.local.example` a `.env.local` y completa los valores:

```bash
cp .env.local.example .env.local
```

Edita `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
DATABASE_URL=postgresql://postgres:TU-PASSWORD@db.tu-proyecto.supabase.co:5432/postgres
```

### 3. Crear tablas en la base de datos

Ejecuta las migraciones de Drizzle:

```bash
npm run db:push
```

O usa `npm run db:generate` + `npm run db:migrate` para migraciones versionadas.

### 4. Crear usuario de prueba

En Supabase Dashboard > Authentication > Users, crea un usuario con email y password.

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Scripts

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build de produccion
npm run start      # Servidor de produccion
npm run lint       # Lint

npm run db:generate  # Genera migraciones
npm run db:migrate   # Ejecuta migraciones
npm run db:push      # Push directo (dev)
npm run db:studio    # Drizzle Studio
```

## Estructura del proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Rutas protegidas
│   │   ├── orders/         # Pedidos
│   │   ├── clients/        # Clientes
│   │   ├── quotes/         # Cotizador
│   │   └── reports/        # Reportes
│   └── login/              # Login
├── components/
│   ├── ui/                 # Componentes base (Button, Input, etc.)
│   ├── layout/             # Sidebar, Header
│   └── providers/          # QueryProvider
├── lib/
│   ├── db/                 # Drizzle schema + connection
│   ├── supabase/           # Supabase clients
│   ├── validations/        # Zod schemas
│   └── utils/              # Helpers (dates, export)
├── stores/                 # Zustand stores
└── hooks/                  # React Query hooks
```

## Proximos pasos

1. Conectar Supabase (seguir pasos arriba)
2. Agregar formularios de crear pedido/cliente
3. Implementar tabla de pedidos con TanStack Table
4. Agregar funcionalidad de comentarios
5. Configurar Inngest para notificaciones
