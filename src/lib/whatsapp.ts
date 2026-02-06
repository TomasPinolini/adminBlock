import twilio from "twilio"

// Check if Twilio is configured
const isTwilioConfigured = !!(process.env.TWILIO_API_KEY_SID && 
  process.env.TWILIO_API_KEY_SECRET && 
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_WHATSAPP_FROM)

// Initialize Twilio client with API Key authentication (only if configured)
const client = isTwilioConfigured 
  ? twilio(
      process.env.TWILIO_API_KEY_SID!,
      process.env.TWILIO_API_KEY_SECRET!,
      { accountSid: process.env.TWILIO_ACCOUNT_SID! }
    )
  : null

const fromNumber = process.env.TWILIO_WHATSAPP_FROM 
  ? `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}` 
  : null

interface SendWhatsAppParams {
  to: string // Phone number with country code, e.g., "+5493412775961"
  message: string
}

interface WhatsAppResult {
  success: boolean
  sid?: string
  error?: string
}

export function isWhatsAppEnabled(): boolean {
  return isTwilioConfigured
}

export async function sendWhatsApp({ to, message }: SendWhatsAppParams): Promise<WhatsAppResult> {
  // Check if Twilio is configured
  if (!isTwilioConfigured || !client || !fromNumber) {
    console.warn("WhatsApp: Twilio not configured, skipping message")
    return { success: false, error: "Twilio not configured" }
  }

  // Validate phone number
  if (!to || to.trim().length < 8) {
    console.warn("WhatsApp: Invalid phone number")
    return { success: false, error: "Invalid phone number" }
  }

  // Format the "to" number for WhatsApp
  const cleanNumber = to.replace(/\s/g, "").replace(/^0/, "+54") // Handle local AR numbers
  const toNumber = cleanNumber.startsWith("whatsapp:") 
    ? cleanNumber 
    : `whatsapp:${cleanNumber}`

  try {
    const result = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: message,
    })

    console.log(`WhatsApp sent to ${to}: ${result.sid}`)
    return { success: true, sid: result.sid }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("WhatsApp send error:", errorMessage)
    return { success: false, error: errorMessage }
  }
}

// Safe background send - doesn't throw, logs errors
export function sendWhatsAppBackground(params: SendWhatsAppParams): void {
  sendWhatsApp(params)
    .then((result) => {
      if (!result.success) {
        console.warn(`WhatsApp background send failed: ${result.error}`)
      }
    })
    .catch((err) => {
      console.error("WhatsApp background send error:", err)
    })
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
