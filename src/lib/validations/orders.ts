import { z } from "zod"

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

export const serviceTypeLabels: Record<(typeof serviceTypes)[number], string> = {
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
  serviceType: z.enum(serviceTypes, {
    errorMap: () => ({ message: "Tipo de servicio inválido" }),
  }),
  description: z.string().min(1, "Descripción requerida"),
  price: z.string().optional(),
  dueDate: z.string().optional(),
})

export const updateOrderSchema = z.object({
  serviceType: z.enum(serviceTypes).optional(),
  status: z.enum(orderStatuses).optional(),
  description: z.string().min(1).optional(),
  price: z.string().optional(),
  dueDate: z.string().optional(),
})

export const createCommentSchema = z.object({
  orderId: z.string().uuid(),
  content: z.string().min(1, "El comentario no puede estar vacio"),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>
