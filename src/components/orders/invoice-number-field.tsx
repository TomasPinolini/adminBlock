"use client"

import { useState } from "react"
import { Hash, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNextInvoiceNumber, useConsumeInvoiceNumber } from "@/hooks/use-afip"
import { formatInvoiceNumber } from "@/lib/utils/invoice"
import { toast } from "sonner"

interface InvoiceNumberFieldProps {
  invoiceType: string | null
  value: string
  onChange: (value: string) => void
  puntoVenta?: string
}

export function InvoiceNumberField({ invoiceType, value, onChange, puntoVenta = "00001" }: InvoiceNumberFieldProps) {
  const { data: nextNumber } = useNextInvoiceNumber(invoiceType, puntoVenta)
  const consumeNumber = useConsumeInvoiceNumber()
  const [isAssigning, setIsAssigning] = useState(false)

  const handleAutoAssign = async () => {
    if (!invoiceType || invoiceType === "none") {
      toast.error("Selecciona un tipo de comprobante primero")
      return
    }

    setIsAssigning(true)
    try {
      const result = await consumeNumber.mutateAsync({ invoiceType, puntoVenta })
      const formatted = formatInvoiceNumber(result.puntoVenta, result.number)
      onChange(formatted)
      toast.success(`Numero asignado: ${formatted}`)
    } catch {
      toast.error("Error al asignar numero")
    } finally {
      setIsAssigning(false)
    }
  }

  const showAutoAssign = invoiceType && invoiceType !== "none"

  return (
    <div>
      <label className="text-sm font-medium">Numero de comprobante</label>
      {showAutoAssign && nextNumber && (
        <p className="text-xs text-muted-foreground mt-0.5">
          Proximo: {formatInvoiceNumber(puntoVenta, nextNumber.number)}
        </p>
      )}
      <div className="flex gap-2 mt-1.5">
        <Input
          placeholder={showAutoAssign ? formatInvoiceNumber(puntoVenta, nextNumber?.number ?? 1) : "Numero"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-[200px]"
        />
        {showAutoAssign && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoAssign}
            disabled={isAssigning}
          >
            {isAssigning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Hash className="h-4 w-4" />
            )}
            <span className="ml-1.5">Auto-asignar</span>
          </Button>
        )}
      </div>
    </div>
  )
}
