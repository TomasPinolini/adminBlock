"use client"

import { useState, useEffect } from "react"
import { Mail, Send, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { sendEmail } from "@/lib/utils/email"
import { escapeHtml } from "@/lib/utils/validation"
import { toast } from "sonner"

interface EmailComposeModalProps {
  open: boolean
  onClose: () => void
  to: string
  clientName: string
  defaultSubject?: string
  defaultBody?: string
}

export function EmailComposeModal({
  open,
  onClose,
  to,
  clientName,
  defaultSubject = "",
  defaultBody = "",
}: EmailComposeModalProps) {
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState(defaultBody)
  const [sending, setSending] = useState(false)

  // Sync state when modal opens with new props (different order)
  useEffect(() => {
    if (open) {
      setSubject(defaultSubject)
      setBody(defaultBody)
    }
  }, [open, defaultSubject, defaultBody])

  const handleOpen = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Completá el asunto y el mensaje")
      return
    }

    setSending(true)
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">¡Hola ${escapeHtml(clientName)}!</h2>
          ${body.split("\n").map((line) => `<p style="font-size: 16px; color: #555; margin: 8px 0;">${escapeHtml(line) || "&nbsp;"}</p>`).join("")}
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">AdminBlock</p>
        </div>
      `

      const result = await sendEmail({ to, subject, html })
      if (result.success) {
        toast.success(`Email enviado a ${clientName}`)
        onClose()
      } else {
        toast.error(result.error || "Error al enviar email")
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* To */}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <span className="text-muted-foreground">Para: </span>
            <span className="font-medium">{clientName}</span>
            <span className="text-muted-foreground ml-1">({to})</span>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="email-subject">Asunto *</Label>
            <Input
              id="email-subject"
              placeholder="Asunto del email..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-11"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="email-body">Mensaje *</Label>
            <Textarea
              id="email-body"
              placeholder="Escribí tu mensaje..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              El email incluirá automáticamente un saludo con el nombre del cliente.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={sending}>
              Cancelar
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
