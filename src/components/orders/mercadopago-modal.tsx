"use client"

import { useState, useEffect } from "react"
import { Link2, MessageCircle, Mail, Copy, Loader2, CheckCircle, ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { getWhatsAppLink } from "@/lib/utils/messaging"
import { sendEmail } from "@/lib/utils/email"
import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout"
import type { OrderWithClient } from "@/hooks/use-orders"

interface MercadoPagoModalProps {
  order: OrderWithClient | null
  open: boolean
  onClose: () => void
}

export function MercadoPagoModal({ order, open, onClose }: MercadoPagoModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentLink, setPaymentLink] = useState<string | null>(null)
  const [amount, setAmount] = useState<number>(0)
  const [copied, setCopied] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  // Generate payment link when modal opens
  useEffect(() => {
    if (open && order) {
      generateLink()
    }
    if (!open) {
      setPaymentLink(null)
      setAmount(0)
      setError(null)
      setCopied(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order?.id])

  const generateLink = async () => {
    if (!order) return

    setLoading(true)
    setError(null)
    setPaymentLink(null)

    try {
      const res = await fetchWithTimeout(`/api/orders/${order.id}/mercadopago`, {
        method: "POST",
        timeout: 20000,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(data.error || "Error al generar link de pago")
      }

      const data = await res.json()
      setPaymentLink(data.init_point)
      setAmount(data.amount)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar link de pago")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!paymentLink) return

    try {
      await navigator.clipboard.writeText(paymentLink)
      setCopied(true)
      toast.success("Link copiado al portapapeles")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("No se pudo copiar el link")
    }
  }

  const handleWhatsApp = () => {
    if (!paymentLink || !order?.client?.phone) return

    const clientName = order.client.name || "Cliente"
    const serviceType = order.serviceType || "pedido"
    const message = `Hola ${clientName}! Aca te dejo el link para pagar tu pedido de ${serviceType} ($${amount.toLocaleString("es-AR")}): ${paymentLink}`

    const whatsappUrl = getWhatsAppLink(order.client.phone, message)
    window.open(whatsappUrl, "_blank")
  }

  const handleEmail = async () => {
    if (!paymentLink || !order?.client?.email) return

    const clientName = order.client.name || "Cliente"
    const serviceType = order.serviceType || "pedido"

    setSendingEmail(true)
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hola ${clientName}!</h2>
          <p style="font-size: 16px; color: #555;">
            Te enviamos el link de pago para tu pedido de <strong>${serviceType}</strong>.
          </p>
          <p style="font-size: 16px; color: #555;">
            Monto a pagar: <strong>$${amount.toLocaleString("es-AR")}</strong>
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentLink}"
               style="display: inline-block; background-color: #009ee3; color: #ffffff; font-size: 18px; font-weight: bold; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
              Pagar ahora
            </a>
          </div>
          <p style="font-size: 14px; color: #888;">
            O copia este link en tu navegador:<br />
            <a href="${paymentLink}" style="color: #009ee3; word-break: break-all;">${paymentLink}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">AdminBlock</p>
        </div>
      `

      const result = await sendEmail({
        to: order.client.email,
        subject: "Link de pago - AdminBlock",
        html,
      })

      if (result.success) {
        toast.success(`Email enviado a ${clientName}`)
      } else {
        toast.error(result.error || "Error al enviar email")
      }
    } catch {
      toast.error("Error al enviar email")
    } finally {
      setSendingEmail(false)
    }
  }

  if (!order) return null

  const clientName = order.client?.name || "Cliente"
  const serviceType = order.serviceType || "pedido"
  const hasPhone = !!order.client?.phone
  const hasEmail = !!order.client?.email

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Link de pago - Mercado Pago
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Generando link de pago...</p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="rounded-lg bg-destructive/10 p-4 text-center space-y-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={generateLink}>
                Reintentar
              </Button>
            </div>
          )}

          {/* Success state */}
          {paymentLink && !loading && (
            <>
              {/* Order summary */}
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Servicio:</span>
                  <span className="font-medium">{serviceType}</span>
                </div>
                <div className="flex justify-between border-t pt-1 mt-1">
                  <span className="text-muted-foreground">Monto a pagar:</span>
                  <span className="font-bold">${amount.toLocaleString("es-AR")}</span>
                </div>
              </div>

              {/* Payment link */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Link de pago</label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={paymentLink}
                    className="h-11 text-sm"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0"
                    onClick={handleCopy}
                    title="Copiar link"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Open in browser */}
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={() => window.open(paymentLink, "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir link de pago
              </Button>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleWhatsApp}
                  disabled={!hasPhone}
                  title={!hasPhone ? "El cliente no tiene telefono" : undefined}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
                <Button
                  className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleEmail}
                  disabled={!hasEmail || sendingEmail}
                  title={!hasEmail ? "El cliente no tiene email" : undefined}
                >
                  {sendingEmail ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Email
                </Button>
              </div>

              {/* Hints for disabled buttons */}
              {(!hasPhone || !hasEmail) && (
                <p className="text-xs text-muted-foreground text-center">
                  {!hasPhone && !hasEmail
                    ? "El cliente no tiene telefono ni email registrado"
                    : !hasPhone
                    ? "El cliente no tiene telefono registrado"
                    : "El cliente no tiene email registrado"}
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
