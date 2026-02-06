"use client"

import { ErrorBoundary } from "@/components/error-boundary"
import { AlertTriangle, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface PageErrorFallbackProps {
  error: Error
  resetError: () => void
}

function PageErrorFallback({ error, resetError }: PageErrorFallbackProps) {
  return (
    <div className="flex min-h-[600px] flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Error en la página</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        Ocurrió un error al cargar esta página. Puedes intentar recargarla o volver al inicio.
      </p>
      {error && process.env.NODE_ENV === "development" && (
        <details className="mb-6 text-left max-w-2xl w-full">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground mb-2">
            Detalles del error (solo en desarrollo)
          </summary>
          <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
            {error.toString()}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}
      <div className="flex gap-3">
        <Button onClick={resetError} variant="outline">
          Reintentar
        </Button>
        <Link href="/">
          <Button className="gap-2">
            <Home className="h-4 w-4" />
            Ir al inicio
          </Button>
        </Link>
      </div>
    </div>
  )
}

interface PageErrorBoundaryProps {
  children: React.ReactNode
}

export function PageErrorBoundary({ children }: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <PageErrorFallback
          error={new Error("Error desconocido")}
          resetError={() => window.location.reload()}
        />
      }
    >
      {children}
    </ErrorBoundary>
  )
}
