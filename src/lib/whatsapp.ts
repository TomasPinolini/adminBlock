import twilio from "twilio"

// Initialize Twilio client with API Key authentication
const client = twilio(
  process.env.TWILIO_API_KEY_SID!,
  process.env.TWILIO_API_KEY_SECRET!,
  { accountSid: process.env.TWILIO_ACCOUNT_SID! }
)

const fromNumber = `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`

interface SendWhatsAppParams {
  to: string // Phone number with country code, e.g., "+5493412775961"
  message: string
}

export async function sendWhatsApp({ to, message }: SendWhatsAppParams) {
  // Format the "to" number for WhatsApp
  const toNumber = `whatsapp:${to.replace(/\s/g, "")}`

  try {
    const result = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: message,
    })

    console.log(`WhatsApp sent to ${to}: ${result.sid}`)
    return { success: true, sid: result.sid }
  } catch (error) {
    console.error("WhatsApp send error:", error)
    throw error
  }
}

// Pre-built message templates in Spanish
export const whatsappTemplates = {
  orderReady: (clientName: string, serviceType: string) =>
    `Hola ${clientName}! Tu pedido de ${serviceType} ya está listo para retirar. Te esperamos!`,

  quoteReady: (clientName: string, serviceType: string, price: string) =>
    `Hola ${clientName}! El presupuesto para tu ${serviceType} es de $${price}. Avisanos si querés que lo hagamos!`,

  paymentConfirmed: (clientName: string, amount: string, remaining?: string) =>
    remaining && Number(remaining) > 0
      ? `Hola ${clientName}! Confirmamos tu pago de $${amount}. Resta abonar $${remaining}. Gracias!`
      : `Hola ${clientName}! Confirmamos tu pago de $${amount}. Pedido pagado en su totalidad. Gracias!`,

  orderInProgress: (clientName: string, serviceType: string) =>
    `Hola ${clientName}! Tu ${serviceType} ya está en proceso. Te avisamos cuando esté listo!`,
}
