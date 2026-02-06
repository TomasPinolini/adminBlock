# Error Boundaries - AdminBlock

## ¿Qué son los Error Boundaries?

Los Error Boundaries son componentes de React que capturan errores de JavaScript en cualquier parte del árbol de componentes hijo, registran esos errores y muestran una UI de respaldo en lugar de que la aplicación se rompa completamente.

## Implementación

### Error Boundary Global

Ya está implementado en `src/app/layout.tsx` y captura todos los errores de la aplicación:

```tsx
<ErrorBoundary>
  <QueryProvider>{children}</QueryProvider>
</ErrorBoundary>
```

### Error Boundary por Página

Para páginas específicas que necesitan manejo de errores personalizado:

```tsx
import { PageErrorBoundary } from "@/components/page-error-boundary"

export default function MyPage() {
  return (
    <PageErrorBoundary>
      {/* Tu contenido aquí */}
    </PageErrorBoundary>
  )
}
```

## Componentes Disponibles

### 1. ErrorBoundary (Base)
**Ubicación:** `src/components/error-boundary.tsx`

Componente base que captura errores y muestra una UI de respaldo.

**Props:**
- `children`: Contenido a proteger
- `fallback` (opcional): UI personalizada para mostrar en caso de error

**Ejemplo:**
```tsx
<ErrorBoundary fallback={<div>Error personalizado</div>}>
  <MyComponent />
</ErrorBoundary>
```

### 2. PageErrorBoundary
**Ubicación:** `src/components/page-error-boundary.tsx`

Error boundary específico para páginas con opciones de navegación.

**Características:**
- Botón "Reintentar" para recargar la página
- Botón "Ir al inicio" para volver al dashboard
- Muestra detalles del error en desarrollo
- Oculta detalles técnicos en producción

## Qué Capturan

✅ **SÍ capturan:**
- Errores en el renderizado de componentes
- Errores en métodos del ciclo de vida
- Errores en constructores
- Errores en event handlers (si se propagan)

❌ **NO capturan:**
- Errores en event handlers (necesitan try/catch)
- Código asíncrono (setTimeout, fetch, etc.)
- Errores en Server Components
- Errores en el propio Error Boundary

## Mejores Prácticas

### 1. Usar try/catch para código asíncrono
```tsx
const handleClick = async () => {
  try {
    await someAsyncOperation()
  } catch (error) {
    console.error(error)
    toast.error("Error al realizar la operación")
  }
}
```

### 2. Usar Error Boundaries en límites de componentes
```tsx
// ✅ Bueno: Protege una sección específica
<ErrorBoundary>
  <ComplexFeature />
</ErrorBoundary>

// ❌ Malo: Demasiado granular
<ErrorBoundary>
  <Button />
</ErrorBoundary>
```

### 3. Logging de errores
Los errores se registran automáticamente en `console.error`. En producción, considera integrar con un servicio de monitoreo como Sentry.

## Testing

Para probar el error boundary en desarrollo:

```tsx
// Componente de prueba que lanza un error
function ErrorTest() {
  throw new Error("Error de prueba")
  return <div>Nunca se renderiza</div>
}

// Usar en tu página
<ErrorBoundary>
  <ErrorTest />
</ErrorBoundary>
```

## Estado Actual

- ✅ Error Boundary global en root layout
- ✅ PageErrorBoundary para páginas individuales
- ✅ UI de respaldo con opciones de recuperación
- ✅ Detalles técnicos en desarrollo
- ⏳ Integración con servicio de monitoreo (futuro)

## Próximos Pasos

1. Considerar agregar PageErrorBoundary a páginas críticas
2. Integrar con Sentry u otro servicio de error tracking
3. Agregar telemetría para errores frecuentes
4. Crear error boundaries específicos por feature
