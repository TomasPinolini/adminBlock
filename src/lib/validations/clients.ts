import { z } from "zod"

export const clientTypeEnum = z.enum(["individual", "company"])

export const createClientSchema = z.object({
  clientType: clientTypeEnum,
  name: z.string().min(1, "Nombre requerido"),
  phone: z.string().optional(),
  instagramHandle: z.string().optional(),
  notes: z.string().optional(),
  // Optional: link individual to a company on creation
  companyId: z.string().uuid().optional().nullable(),
  role: z.string().optional(),
})

export const updateClientSchema = z.object({
  clientType: clientTypeEnum.optional(),
  name: z.string().min(1, "Nombre requerido").optional(),
  phone: z.string().optional(),
  instagramHandle: z.string().optional(),
  notes: z.string().optional(),
})

export const clientTypeLabels: Record<z.infer<typeof clientTypeEnum>, string> = {
  individual: "Persona",
  company: "Empresa",
}

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
