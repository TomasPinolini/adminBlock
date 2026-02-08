"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Mail, Bell, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NotificationSetting {
  key: string
  label: string
  description: string
}

const whatsappSettings: NotificationSetting[] = [
  {
    key: "whatsapp.auto.ready",
    label: "Pedido Listo",
    description: "Enviar WhatsApp cuando el pedido está listo para retirar",
  },
  {
    key: "whatsapp.auto.quoted",
    label: "Cotización enviada",
    description: "Enviar WhatsApp con el presupuesto cuando se cotiza",
  },
  {
    key: "whatsapp.auto.in_progress",
    label: "En proceso",
    description: "Enviar WhatsApp cuando el pedido entra en proceso",
  },
  {
    key: "whatsapp.auto.payment",
    label: "Pago registrado",
    description: "Enviar WhatsApp confirmando el pago recibido",
  },
]

const emailSettings: NotificationSetting[] = [
  {
    key: "email.auto.ready",
    label: "Pedido Listo",
    description: "Enviar email cuando el pedido está listo para retirar",
  },
  {
    key: "email.auto.quoted",
    label: "Cotización enviada",
    description: "Enviar email con el presupuesto cuando se cotiza",
  },
  {
    key: "email.auto.in_progress",
    label: "En proceso",
    description: "Enviar email cuando el pedido entra en proceso",
  },
  {
    key: "email.auto.payment",
    label: "Pago registrado",
    description: "Enviar email confirmando el pago recibido",
  },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleSetting(key: string) {
    const currentValue = settings[key] === "true"
    const newValue = !currentValue

    setSaving(key)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: String(newValue) }),
      })

      if (res.ok) {
        setSettings((prev) => ({ ...prev, [key]: String(newValue) }))
      }
    } catch (error) {
      console.error("Error updating setting:", error)
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">Ajustes</h1>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold">Ajustes</h1>
        <p className="text-sm text-muted-foreground">
          Configuración del sistema
        </p>
      </div>

      {/* WhatsApp Notifications Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold">Notificaciones de WhatsApp</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Cuando estas opciones están activadas, se envía un WhatsApp automático
          al cliente cada vez que ocurre el evento correspondiente.
        </p>

        <div className="space-y-3">
          {whatsappSettings.map((setting) => {
            const isEnabled = settings[setting.key] === "true"
            const isSaving = saving === setting.key

            return (
              <div
                key={setting.key}
                className="flex items-center justify-between rounded-lg border bg-background p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {isEnabled ? (
                      <Bell className="h-4 w-4 text-green-600" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{setting.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {setting.description}
                  </p>
                </div>
                <Button
                  variant={isEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSetting(setting.key)}
                  disabled={isSaving}
                  className="ml-4 min-w-[80px]"
                >
                  {isSaving ? "..." : isEnabled ? "Activado" : "Desactivado"}
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Email Notifications Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Notificaciones por Email</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Cuando estas opciones están activadas, se envía un email automático
          al cliente cada vez que ocurre el evento correspondiente.
        </p>

        <div className="space-y-3">
          {emailSettings.map((setting) => {
            const isEnabled = settings[setting.key] === "true"
            const isSaving = saving === setting.key

            return (
              <div
                key={setting.key}
                className="flex items-center justify-between rounded-lg border bg-background p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {isEnabled ? (
                      <Bell className="h-4 w-4 text-blue-500" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{setting.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {setting.description}
                  </p>
                </div>
                <Button
                  variant={isEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSetting(setting.key)}
                  disabled={isSaving}
                  className="ml-4 min-w-[80px]"
                >
                  {isSaving ? "..." : isEnabled ? "Activado" : "Desactivado"}
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
        <h3 className="font-medium text-blue-900 dark:text-blue-100">
          ¿Cómo funciona?
        </h3>
        <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>• Los mensajes se envían automáticamente vía Twilio (WhatsApp) o Resend (Email)</li>
          <li>• El cliente debe tener teléfono cargado (WhatsApp) o email cargado (Email)</li>
          <li>• Los botones manuales de WhatsApp y Email en cada pedido siguen funcionando siempre</li>
          <li>• Estas opciones solo controlan el envío automático al cambiar el estado</li>
        </ul>
      </div>
    </div>
  )
}
