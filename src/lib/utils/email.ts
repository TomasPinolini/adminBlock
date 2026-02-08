// Email templates for AdminBlock
// These mirror the WhatsApp message templates but in HTML format

export const emailTemplates = {
  orderReady: (clientName: string, serviceType: string) => ({
    subject: `Tu ${serviceType} esta listo - AdminBlock`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">¡Hola ${clientName}!</h2>
        <p style="font-size: 16px; color: #555;">
          Te avisamos que tu <strong>${serviceType.toLowerCase()}</strong> ya está listo para retirar.
        </p>
        <p style="font-size: 16px; color: #555;">¡Te esperamos!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">AdminBlock</p>
      </div>
    `,
  }),

  quote: (clientName: string, serviceType: string, price: string) => ({
    subject: `Cotizacion ${serviceType} - AdminBlock`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">¡Hola ${clientName}!</h2>
        <p style="font-size: 16px; color: #555;">
          La cotización para <strong>${serviceType.toLowerCase()}</strong> es de:
        </p>
        <p style="font-size: 28px; font-weight: bold; color: #333; text-align: center; margin: 20px 0;">
          $${price}
        </p>
        <p style="font-size: 16px; color: #555;">
          Avisame si querés que avancemos con el trabajo.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">AdminBlock</p>
      </div>
    `,
  }),

  inProgress: (clientName: string, serviceType: string) => ({
    subject: `Tu ${serviceType} esta en proceso - AdminBlock`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">¡Hola ${clientName}!</h2>
        <p style="font-size: 16px; color: #555;">
          Ya estamos trabajando en tu <strong>${serviceType.toLowerCase()}</strong>.
        </p>
        <p style="font-size: 16px; color: #555;">
          Te aviso cuando esté listo. ¡Gracias por tu confianza!
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">AdminBlock</p>
      </div>
    `,
  }),

  reminder: (clientName: string) => ({
    subject: `Recordatorio pedido pendiente - AdminBlock`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">¡Hola ${clientName}!</h2>
        <p style="font-size: 16px; color: #555;">
          Te escribo para recordarte que tenés un pedido pendiente de retirar.
        </p>
        <p style="font-size: 16px; color: #555;">¡Te esperamos!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">AdminBlock</p>
      </div>
    `,
  }),

  thanks: (clientName: string) => ({
    subject: `Gracias por tu pedido - AdminBlock`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">¡Hola ${clientName}!</h2>
        <p style="font-size: 16px; color: #555;">
          Gracias por tu pedido. Cualquier cosa que necesites, escribime.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">AdminBlock</p>
      </div>
    `,
  }),
}

// Send email via our API route (which calls the Supabase Edge Function)
export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })

    if (!res.ok) {
      const data = await res.json()
      return { success: false, error: data.error || "Error al enviar email" }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: "Error de conexión" }
  }
}
