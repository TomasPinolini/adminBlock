import { serviceTypeLabels, orderStatusLabels } from "@/lib/validations/orders"
import type { OrderStatus, ServiceType } from "@/lib/db/schema"
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
