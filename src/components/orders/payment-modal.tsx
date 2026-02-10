"use client"

import { useState, useRef } from "react"
import { Upload, Receipt, CheckCircle, AlertTriangle, X, FileText } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { useRegisterPayment, type OrderWithClient } from "@/hooks/use-orders"
import { cn } from "@/lib/utils"

const IVA_RATE = 0.21

interface PaymentModalProps {
  order: OrderWithClient | null
  open: boolean
  onClose: () => void
}

export function PaymentModal({ order, open, onClose }: PaymentModalProps) {
  const [receipt, setReceipt] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [invoiceType, setInvoiceType] = useState<"A" | "B" | "none">("none")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [error, setError] = useState("")
  const [validationResult, setValidationResult] = useState<{
    amountMatch: boolean
    difference: number
    status: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const registerPayment = useRegisterPayment()

  const orderPrice = Number(order?.price || 0)
  const previousPaid = Number(order?.paymentAmount || 0)
  const remaining = orderPrice - previousPaid

  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Solo se permiten archivos PDF.")
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("El archivo es muy grande. Máximo 5MB.")
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }
      setError("")
      setReceipt(file)
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleRemoveFile = () => {
    setReceipt(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return

    setError("")
    setValidationResult(null)

    try {
      const result = await registerPayment.mutateAsync({
        orderId: order.id,
        paymentAmount: remaining > 0 ? remaining : orderPrice,
        receipt: receipt || undefined,
        invoiceType: invoiceType !== "none" ? invoiceType : undefined,
        invoiceNumber: invoiceNumber || undefined,
      })

      setValidationResult(result.validation)

      // If fully paid, close after showing success
      if (result.validation.amountMatch) {
        setTimeout(() => {
          handleClose()
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar pago")
    }
  }

  const handleClose = () => {
    setReceipt(null)
    setPreviewUrl(null)
    setInvoiceType("none")
    setInvoiceNumber("")
    setError("")
    setValidationResult(null)
    onClose()
  }

  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Registrar Pago
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order Info */}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Precio del pedido:</span>
              <span className="font-medium">${orderPrice.toLocaleString("es-AR")}</span>
            </div>
            {previousPaid > 0 && (
              <>
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">Ya pagado:</span>
                  <span className="font-medium text-green-600">
                    ${previousPaid.toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="flex justify-between mt-1 border-t pt-1">
                  <span className="text-muted-foreground">Restante:</span>
                  <span className="font-bold">${remaining.toLocaleString("es-AR")}</span>
                </div>
              </>
            )}
          </div>

          {/* Invoice Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              Tipo de factura
            </Label>
            <Select
              value={invoiceType}
              onValueChange={(v) => setInvoiceType(v as "A" | "B" | "none")}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin factura</SelectItem>
                <SelectItem value="A">Factura A (discrimina IVA)</SelectItem>
                <SelectItem value="B">Factura B (consumidor final)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Number (only if factura selected) */}
          {invoiceType !== "none" && (
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Número de factura</Label>
              <Input
                id="invoiceNumber"
                type="text"
                placeholder="Ej: 0001-00001234"
                className="h-11"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
          )}

          {/* IVA Breakdown (only for Factura A) */}
          {invoiceType === "A" && orderPrice > 0 && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal (sin IVA):</span>
                <span className="font-medium">
                  ${(orderPrice / (1 + IVA_RATE)).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA (21%):</span>
                <span className="font-medium">
                  ${(orderPrice - orderPrice / (1 + IVA_RATE)).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold">
                  ${orderPrice.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label>Comprobante (opcional)</Label>
            {!receipt ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Click para subir comprobante
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Solo PDF (máx. 5MB)
                </p>
              </div>
            ) : (
              <div className="relative border rounded-lg p-3">
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="flex items-center gap-2">
                  <FileText className="h-8 w-8 text-red-500" />
                  <span className="text-sm truncate">{receipt.name}</span>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div
              className={cn(
                "rounded-lg p-3 flex items-start gap-2",
                validationResult.amountMatch
                  ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-400"
                  : "bg-orange-50 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400"
              )}
            >
              {validationResult.amountMatch ? (
                <CheckCircle className="h-5 w-5 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 shrink-0" />
              )}
              <div className="text-sm">
                {validationResult.amountMatch ? (
                  <p className="font-medium">¡Pago completo registrado!</p>
                ) : (
                  <>
                    <p className="font-medium">Pago parcial registrado</p>
                    <p>Faltan ${validationResult.difference.toLocaleString("es-AR")}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-11"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={registerPayment.isPending}
              className="flex-1 h-11"
            >
              {registerPayment.isPending ? "Registrando..." : "Registrar Pago"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
