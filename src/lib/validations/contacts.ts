import { z } from "zod"

export const createContactSchema = z.object({
  clientId: z.string().uuid("ID de cliente inválido"),
  name: z.string().min(1, "Nombre requerido"),
  phone: z.string().optional(),
  instagramHandle: z.string().optional(),
  role: z.string().optional(),
  notes: z.string().optional(),
})

export const updateContactSchema = z.object({
  name: z.string().min(1, "Nombre requerido").optional(),
  phone: z.string().optional(),
  instagramHandle: z.string().optional(),
  role: z.string().optional(),
  notes: z.string().optional(),
})

export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
