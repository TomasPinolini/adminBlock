# Migration Notes - AdminBlock

## Legacy Contacts Table Deprecation

**Status:** DEPRECATED (usar `clientRelationships` en su lugar)

### Context
La tabla `contacts` fue reemplazada por el sistema de relaciones `clientRelationships` que permite vincular personas (individuales) con empresas de manera más flexible.

### Migration Path
```sql
-- La tabla contacts ya no se usa en la UI
-- Todos los nuevos vínculos se crean en client_relationships
-- Los datos existentes en contacts permanecen por compatibilidad con pedidos antiguos

-- Para migrar datos existentes (si es necesario):
-- 1. Identificar contacts que no tienen relación en client_relationships
-- 2. Crear las relaciones correspondientes
-- 3. Actualizar referencias en orders si es necesario

-- NO ELIMINAR la tabla contacts hasta verificar que:
-- - No hay orders.contactId que apunten a registros huérfanos
-- - Todos los vínculos están migrados a client_relationships
```

### Current State
- ✅ UI usa `clientRelationships` exclusivamente
- ✅ API de contacts mantiene compatibilidad
- ⏳ Migración de datos pendiente (manual cuando sea necesario)
- ⏳ Eliminar tabla después de verificar integridad de datos

### Files Affected
- `src/lib/db/schema.ts` - Tabla marcada como LEGACY
- `src/components/clients/contacts-modal.tsx` - Usa clientRelationships
- `src/hooks/use-relationships.ts` - API moderna
- `src/app/api/contacts/*` - Mantiene compatibilidad con pedidos antiguos
