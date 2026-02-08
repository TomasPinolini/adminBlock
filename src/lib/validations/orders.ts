import { z } from "zod"

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
  serviceType: z.string().min(1, "Tipo de servicio requerido"),
  description: z.string().min(1, "Descripción requerida"),
  price: z.string().optional(),
  dueDate: z.string().optional(),
  // Invoice fields
  invoiceNumber: z.string().optional(),
  invoiceType: z.enum(invoiceTypes).optional(),
  quantity: z.string().optional(),
  subtotal: z.string().optional(),
  taxAmount: z.string().optional(),
})

export const updateOrderSchema = z.object({
  serviceType: z.string().min(1).optional(),
  status: z.enum(orderStatuses).optional(),
  description: z.string().min(1).nullable().optional(),
  price: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  // Invoice fields
  invoiceNumber: z.string().nullable().optional(),
  invoiceType: z.enum(invoiceTypes).nullable().optional(),
  quantity: z.string().nullable().optional(),
  subtotal: z.string().nullable().optional(),
  taxAmount: z.string().nullable().optional(),
})

export const createCommentSchema = z.object({
  orderId: z.string().uuid(),
  content: z.string().min(1, "El comentario no puede estar vacio"),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
