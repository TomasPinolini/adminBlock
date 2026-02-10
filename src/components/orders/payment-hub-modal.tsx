"use client"

import { CreditCard, Upload, ChevronRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { OrderWithClient } from "@/hooks/use-orders"

interface PaymentHubModalProps {
  order: OrderWithClient | null
  open: boolean
  onClose: () => void
  onSelectMercadoPago: (order: OrderWithClient) => void
  onSelectDirect: (order: OrderWithClient) => void
}

const paymentOptions = [
  {
    id: "mercadopago" as const,
    label: "Mercado Pago",
    description: "Genera un link de pago automáticamente",
    icon: CreditCard,
    color: "bg-sky-500",
    iconColor: "text-sky-500",
    borderColor: "hover:border-sky-400",
  },
  {
    id: "direct" as const,
    label: "Subir comprobante",
    description: "Registrá un pago y subí el comprobante",
    icon: Upload,
    color: "bg-green-600",
    iconColor: "text-green-600",
    borderColor: "hover:border-green-400",
  },
]

export function PaymentHubModal({
  order,
  open,
  onClose,
  onSelectMercadoPago,
  onSelectDirect,
}: PaymentHubModalProps) {
  if (!order) return null

  const orderPrice = Number(order.price || 0)
  const previousPaid = Number(order.paymentAmount || 0)
  const remaining = orderPrice - previousPaid

  const handleSelect = (optionId: "mercadopago" | "nave" | "direct") => {
    onClose()
    switch (optionId) {
      case "mercadopago":
        onSelectMercadoPago(order)
        break
      case "direct":
        onSelectDirect(order)
        break
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Registrar Pago
          </DialogTitle>
        </DialogHeader>

        {/* Order summary */}
        <div className="rounded-lg bg-muted p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cliente:</span>
            <span className="font-medium">{order.client?.name || "Cliente"}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-muted-foreground">Precio:</span>
            <span className="font-medium">${orderPrice.toLocaleString("es-AR")}</span>
          </div>
          {previousPaid > 0 && (
            <div className="flex justify-between mt-1 border-t pt-1">
              <span className="text-muted-foreground">Restante:</span>
              <span className="font-bold">${remaining.toLocaleString("es-AR")}</span>
            </div>
          )}
        </div>

        {/* Payment options */}
        <div className="space-y-2">
          {paymentOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${option.borderColor} hover:bg-muted/50`}
              >
                <div className={`rounded-lg ${option.color} p-2`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
