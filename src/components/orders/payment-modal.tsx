"use client"

import { useState, useRef } from "react"
import { Upload, Receipt, CheckCircle, AlertTriangle, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRegisterPayment, type OrderWithClient } from "@/hooks/use-orders"
import { cn } from "@/lib/utils"

interface PaymentModalProps {
  order: OrderWithClient | null
  open: boolean
  onClose: () => void
}

export function PaymentModal({ order, open, onClose }: PaymentModalProps) {
  const [paymentAmount, setPaymentAmount] = useState("")
  const [receipt, setReceipt] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
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
    if (!order || !paymentAmount) return

    setError("")
    setValidationResult(null)

    try {
      const result = await registerPayment.mutateAsync({
        orderId: order.id,
        paymentAmount: Number(paymentAmount),
        receipt: receipt || undefined,
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
    setPaymentAmount("")
    setReceipt(null)
    setPreviewUrl(null)
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

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="paymentAmount">Monto del pago *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder={remaining > 0 ? remaining.toString() : "0"}
                className="pl-7 h-11"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
              />
            </div>
            {paymentAmount && Number(paymentAmount) !== remaining && remaining > 0 && (
              <p className={cn(
                "text-xs",
                Number(paymentAmount) < remaining ? "text-orange-600" : "text-green-600"
              )}>
                {Number(paymentAmount) < remaining
                  ? `Faltarían $${(remaining - Number(paymentAmount)).toLocaleString("es-AR")}`
                  : Number(paymentAmount) > remaining
                  ? `Excede por $${(Number(paymentAmount) - remaining).toLocaleString("es-AR")}`
                  : null}
              </p>
            )}
          </div>

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
                  JPG, PNG o PDF (máx. 5MB)
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
                {previewUrl && receipt.type.startsWith("image/") ? (
                  <img
                    src={previewUrl}
                    alt="Comprobante"
                    className="max-h-40 mx-auto rounded"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Receipt className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm truncate">{receipt.name}</span>
                  </div>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
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
              disabled={registerPayment.isPending || !paymentAmount}
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
