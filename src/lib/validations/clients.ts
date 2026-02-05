import { z } from "zod"

export const createClientSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  phone: z.string().optional(),
  instagramHandle: z.string().optional(),
  notes: z.string().optional(),
})

export const updateClientSchema = z.object({
  name: z.string().min(1, "Nombre requerido").optional(),
  phone: z.string().optional(),
  instagramHandle: z.string().optional(),
  notes: z.string().optional(),
})

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
