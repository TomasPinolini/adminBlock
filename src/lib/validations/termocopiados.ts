import { z } from "zod"
import { numericString, numericStringNullable } from "@/lib/utils/validation"

export const createTermocopiadoSchema = z.object({
  clientId: z.string().uuid("Cliente inválido"),
  libros: z.number().int().min(1, "Mínimo 1 libro"),
  copias: z.number().int().min(1, "Mínimo 1 copia"),
  precio: numericString,
})

export const updateTermocopiadoSchema = z.object({
  libros: z.number().int().min(1).optional(),
  copias: z.number().int().min(1).optional(),
  precio: numericStringNullable.optional(),
  paymentStatus: z.enum(["pending", "partial", "paid"]).optional(),
})

export type CreateTermocopiadoInput = z.infer<typeof createTermocopiadoSchema>
export type UpdateTermocopiadoInput = z.infer<typeof updateTermocopiadoSchema>
