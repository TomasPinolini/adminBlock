"use client"

import { Component, ReactNode } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  fallbackTitle?: string
  fallbackMessage?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Route error caught:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
          <div className="flex max-w-md flex-col items-center text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              {this.props.fallbackTitle || "Algo salió mal"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {this.props.fallbackMessage || 
                "Ocurrió un error en esta sección. El resto de la aplicación sigue funcionando."}
            </p>
            {this.state.error && (
              <details className="mb-6 w-full text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Detalles técnicos
                </summary>
                <pre className="mt-2 rounded-md bg-muted p-4 text-xs overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Intentar de nuevo
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = "/"}
              >
                Ir al inicio
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
