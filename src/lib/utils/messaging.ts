import type { OrderStatus } from "@/lib/db/schema"
import { formatPhoneForWhatsApp } from "@/config/phone"

// Clean phone number for WhatsApp (remove spaces, dashes, etc.)
export function cleanPhoneNumber(phone: string): string {
  return formatPhoneForWhatsApp(phone)
}

// Generate WhatsApp link with pre-filled message
export function getWhatsAppLink(phone: string, message: string): string {
  const cleanedPhone = cleanPhoneNumber(phone)
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanedPhone}?text=${encodedMessage}`
}

// Generate Instagram DM link
export function getInstagramLink(handle: string): string {
  const cleanHandle = handle.replace("@", "")
  return `https://ig.me/m/${cleanHandle}`
}

// Message templates - now accepts dynamic service types
export const messageTemplates = {
  orderReady: (clientName: string, serviceType: string) => {
    return `Hola ${clientName}! Tu ${serviceType.toLowerCase()} esta listo para retirar. Te esperamos!`
  },

  quote: (clientName: string, serviceType: string, price: string) => {
    return `Hola ${clientName}! La cotizacion para ${serviceType.toLowerCase()} es de $${price}. Avisame si queres que avancemos!`
  },

  inProgress: (clientName: string, serviceType: string) => {
    return `Hola ${clientName}! Ya estamos trabajando en tu ${serviceType.toLowerCase()}. Te aviso cuando este listo!`
  },

  reminder: (clientName: string) =>
    `Hola ${clientName}! Te escribo para recordarte que tenes un pedido pendiente de retirar. Te esperamos!`,

  thanks: (clientName: string) =>
    `Hola ${clientName}! Gracias por tu pedido. Cualquier cosa que necesites, escribime!`,
}

export type MessageTemplate = keyof typeof messageTemplates
