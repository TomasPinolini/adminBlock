"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { serviceTypes, serviceTypeLabels } from "@/lib/validations/orders"

// Precios de ejemplo - estos vendrian de la base de datos
const EXAMPLE_PRICES: Record<string, { basePrice: number; unitPrice?: number; unit?: string }> = {
  copiado: { basePrice: 0, unitPrice: 50, unit: "pagina" },
  tesis: { basePrice: 2000, unitPrice: 30, unit: "pagina" },
  encuadernacion: { basePrice: 500 },
  carteleria: { basePrice: 0, unitPrice: 800, unit: "m2" },
  placas: { basePrice: 1500 },
  calcos: { basePrice: 0, unitPrice: 200, unit: "unidad" },
  folleteria: { basePrice: 0, unitPrice: 150, unit: "unidad" },
  ploteo: { basePrice: 0, unitPrice: 1200, unit: "m2" },
}

export default function QuotesPage() {
  const [serviceType, setServiceType] = useState<string>("")
  const [quantity, setQuantity] = useState("")
  const [copied, setCopied] = useState(false)

  const pricing = serviceType ? EXAMPLE_PRICES[serviceType] : null
  const calculatedPrice = pricing
    ? pricing.basePrice + (pricing.unitPrice || 0) * (Number(quantity) || 0)
    : 0

  const quoteText = serviceType && calculatedPrice > 0
    ? `Hola! Tu cotizacion para ${serviceTypeLabels[serviceType as keyof typeof serviceTypeLabels]}${quantity ? ` (${quantity} ${pricing?.unit || "unidades"})` : ""}: $${calculatedPrice.toLocaleString("es-AR")}`
    : ""

  const handleCopy = async () => {
    if (quoteText) {
      await navigator.clipboard.writeText(quoteText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold">Cotizador</h1>
        <p className="text-sm text-muted-foreground">
          Genera cotizaciones para Instagram
        </p>
      </div>

      {/* Calculator */}
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border bg-background p-4 lg:p-6">
          <div className="space-y-2">
            <Label>Tipo de servicio</Label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger className="h-11 lg:h-9">
                <SelectValue placeholder="Selecciona un servicio" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((service) => (
                  <SelectItem key={service} value={service}>
                    {serviceTypeLabels[service]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {pricing?.unitPrice && (
            <div className="space-y-2">
              <Label>Cantidad ({pricing.unit})</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Ej: 100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-11 lg:h-9 text-base"
              />
            </div>
          )}

          {pricing && (
            <div className="space-y-1 rounded-md bg-muted p-3 lg:p-4">
              {pricing.basePrice > 0 && (
                <p className="text-sm text-muted-foreground">
                  Precio base: ${pricing.basePrice.toLocaleString("es-AR")}
                </p>
              )}
              {pricing.unitPrice && (
                <p className="text-sm text-muted-foreground">
                  Precio por {pricing.unit}: ${pricing.unitPrice.toLocaleString("es-AR")}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-lg border bg-background p-4 lg:p-6">
          <div>
            <Label className="text-muted-foreground">Precio total</Label>
            <p className="text-3xl lg:text-4xl font-bold">
              ${calculatedPrice.toLocaleString("es-AR")}
            </p>
          </div>

          {quoteText && (
            <div className="space-y-3">
              <Label>Texto para copiar</Label>
              <div className="rounded-md bg-muted p-3 lg:p-4">
                <p className="text-sm">{quoteText}</p>
              </div>
              <Button onClick={handleCopy} className="w-full h-11 lg:h-9">
                {copied ? (
                  <>
                    <Check className="mr-2 h-5 w-5 lg:h-4 lg:w-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-5 w-5 lg:h-4 lg:w-4" />
                    Copiar al portapapeles
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-dashed bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Nota:</strong> Los precios son de ejemplo. Configura tus precios en la tabla service_prices.
        </p>
      </div>
    </div>
  )
}
