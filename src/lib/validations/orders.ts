import { z } from "zod"
import {
  sanitize,
  numericString,
  numericStringNullable,
  MAX_TEXT_SHORT,
  MAX_TEXT_MEDIUM,
  MAX_TEXT_LONG,
} from "@/lib/utils/validation"

// Legacy service types - kept for backward compatibility
// Services are now dynamic and loaded from the database
export const serviceTypes = [
  "copiado",
  "tesis",
  "encuadernacion",
  "carteleria",
  "placas",
  "calcos",
  "folleteria",
  "ploteo",
] as const

export const orderStatuses = [
  "pending_quote",
  "quoted",
  "approved",
  "in_progress",
  "ready",
  "delivered",
  "cancelled",
] as const

export const invoiceTypes = ["A", "B", "none"] as const

export const invoiceTypeLabels: Record<(typeof invoiceTypes)[number], string> = {
  A: "Factura A",
  B: "Factura B",
  none: "Sin factura",
}

// Legacy labels - services are now dynamic
// This is used as fallback when service is not found in database
export const serviceTypeLabels: Record<string, string> = {
  copiado: "Copiado",
  tesis: "Tesis",
  encuadernacion: "Encuadernación",
  carteleria: "Cartelería",
  placas: "Placas",
  calcos: "Calcos",
  folleteria: "Folletería",
  ploteo: "Ploteo",
}

export const orderStatusLabels: Record<(typeof orderStatuses)[number], string> = {
  pending_quote: "Pendiente cotización",
  quoted: "Cotizado",
  approved: "Aprobado",
  in_progress: "En proceso",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
}

export const createOrderSchema = z.object({
  clientId: z.string().uuid("Cliente inválido"),
  personId: z.string().uuid().optional().nullable(),
  serviceType: z.string().min(1, "Tipo de servicio requerido").max(MAX_TEXT_SHORT),
  description: z.string().min(1, "Descripción requerida").max(MAX_TEXT_MEDIUM).transform(sanitize),
  price: numericString.optional(),
  dueDate: z.string().max(20).optional(),
  // Invoice fields
  invoiceNumber: z.string().max(50).optional(),
  invoiceType: z.enum(invoiceTypes).optional(),
  quantity: numericString.optional(),
  subtotal: numericString.optional(),
  taxAmount: numericString.optional(),
})

export const updateOrderSchema = z.object({
  serviceType: z.string().min(1).max(MAX_TEXT_SHORT).optional(),
  status: z.enum(orderStatuses).optional(),
  description: z.string().min(1).max(MAX_TEXT_MEDIUM).transform(sanitize).nullable().optional(),
  price: numericStringNullable.optional(),
  dueDate: z.string().max(20).nullable().optional(),
  // Invoice fields
  invoiceNumber: z.string().max(50).nullable().optional(),
  invoiceType: z.enum(invoiceTypes).nullable().optional(),
  quantity: numericStringNullable.optional(),
  subtotal: numericStringNullable.optional(),
  taxAmount: numericStringNullable.optional(),
})

export const createCommentSchema = z.object({
  orderId: z.string().uuid(),
  content: z.string().min(1, "El comentario no puede estar vacio").max(MAX_TEXT_LONG).transform(sanitize),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
