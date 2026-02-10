"use client"

import { useState } from "react"
import { Link2, MessageCircle, Mail, Copy, Loader2, CheckCircle, ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getWhatsAppLink } from "@/lib/utils/messaging"
import { sendEmail } from "@/lib/utils/email"
import type { OrderWithClient } from "@/hooks/use-orders"

interface SendLinkModalProps {
  order: OrderWithClient | null
  open: boolean
  onClose: () => void
  title?: string
  linkPlaceholder?: string
}

export function SendLinkModal({
  order,
  open,
  onClose,
  title = "Enviar link de pago",
  linkPlaceholder = "https://...",
}: SendLinkModalProps) {
  const [paymentLink, setPaymentLink] = useState("")
  const [copied, setCopied] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  const handleClose = () => {
    setPaymentLink("")
    setCopied(false)
    onClose()
  }

  const handleCopy = async () => {
    if (!paymentLink.trim()) return

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
    if (!paymentLink.trim() || !order?.client?.phone) return

    const clientName = order.client.name || "Cliente"
    const serviceType = order.serviceType || "pedido"
    const remaining = Number(order.price || 0) - Number(order.paymentAmount || 0)
    const message = `Hola ${clientName}! Aca te dejo el link para pagar tu pedido de ${serviceType} ($${remaining.toLocaleString("es-AR")}): ${paymentLink}`

    const whatsappUrl = getWhatsAppLink(order.client.phone, message)
    window.open(whatsappUrl, "_blank")
  }

  const handleEmail = async () => {
    if (!paymentLink.trim() || !order?.client?.email) return

    const clientName = order.client.name || "Cliente"
    const serviceType = order.serviceType || "pedido"
    const remaining = Number(order.price || 0) - Number(order.paymentAmount || 0)

    setSendingEmail(true)
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hola ${clientName}!</h2>
          <p style="font-size: 16px; color: #555;">
            Te enviamos el link de pago para tu pedido de <strong>${serviceType}</strong>.
          </p>
          <p style="font-size: 16px; color: #555;">
            Monto a pagar: <strong>$${remaining.toLocaleString("es-AR")}</strong>
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentLink}"
               style="display: inline-block; background-color: #f97316; color: #ffffff; font-size: 18px; font-weight: bold; padding: 14px 32px; border-radius: 8px; text-decoration: none;">
              Pagar ahora
            </a>
          </div>
          <p style="font-size: 14px; color: #888;">
            O copia este link en tu navegador:<br />
            <a href="${paymentLink}" style="color: #f97316; word-break: break-all;">${paymentLink}</a>
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
  const hasPhone = !!order.client?.phone
  const hasEmail = !!order.client?.email
  const hasLink = !!paymentLink.trim()

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order summary */}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium">{clientName}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Monto:</span>
              <span className="font-bold">
                ${(Number(order.price || 0) - Number(order.paymentAmount || 0)).toLocaleString("es-AR")}
              </span>
            </div>
          </div>

          {/* Link input */}
          <div className="space-y-2">
            <Label htmlFor="payment-link">Link de pago</Label>
            <div className="flex gap-2">
              <Input
                id="payment-link"
                placeholder={linkPlaceholder}
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
                className="h-11 text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0"
                onClick={handleCopy}
                disabled={!hasLink}
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
          {hasLink && (
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={() => window.open(paymentLink, "_blank")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir link
            </Button>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleWhatsApp}
              disabled={!hasPhone || !hasLink}
              title={!hasPhone ? "El cliente no tiene telefono" : undefined}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
            <Button
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleEmail}
              disabled={!hasEmail || sendingEmail || !hasLink}
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

          {/* Hints */}
          {(!hasPhone || !hasEmail) && (
            <p className="text-xs text-muted-foreground text-center">
              {!hasPhone && !hasEmail
                ? "El cliente no tiene telefono ni email registrado"
                : !hasPhone
                ? "El cliente no tiene telefono registrado"
                : "El cliente no tiene email registrado"}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
