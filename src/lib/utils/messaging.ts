import { serviceTypeLabels, orderStatusLabels } from "@/lib/validations/orders"
import type { OrderStatus, ServiceType } from "@/lib/db/schema"

// Clean phone number for WhatsApp (remove spaces, dashes, etc.)
export function cleanPhoneNumber(phone: string): string {
  // Remove everything except digits
  let cleaned = phone.replace(/\D/g, "")

  // If starts with 15, assume Argentina mobile, add 549
  if (cleaned.startsWith("15")) {
    cleaned = "549" + cleaned.substring(2)
  }
  // If starts with 11 (Buenos Aires), add 549
  else if (cleaned.startsWith("11") && cleaned.length === 10) {
    cleaned = "549" + cleaned
  }
  // If doesn't start with country code, assume Argentina
  else if (!cleaned.startsWith("54") && cleaned.length <= 10) {
    cleaned = "549" + cleaned
  }

  return cleaned
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

// Message templates
export const messageTemplates = {
  orderReady: (clientName: string, serviceType: ServiceType) =>
    `Hola ${clientName}! Tu ${serviceTypeLabels[serviceType].toLowerCase()} esta listo para retirar. Te esperamos!`,

  quote: (clientName: string, serviceType: ServiceType, price: string) =>
    `Hola ${clientName}! La cotizacion para ${serviceTypeLabels[serviceType].toLowerCase()} es de $${price}. Avisame si queres que avancemos!`,

  inProgress: (clientName: string, serviceType: ServiceType) =>
    `Hola ${clientName}! Ya estamos trabajando en tu ${serviceTypeLabels[serviceType].toLowerCase()}. Te aviso cuando este listo!`,

  reminder: (clientName: string) =>
    `Hola ${clientName}! Te escribo para recordarte que tenes un pedido pendiente de retirar. Te esperamos!`,

  thanks: (clientName: string) =>
    `Hola ${clientName}! Gracias por tu pedido. Cualquier cosa que necesites, escribime!`,
}

export type MessageTemplate = keyof typeof messageTemplates
