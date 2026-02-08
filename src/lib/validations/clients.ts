import { z } from "zod"
import { sanitize, MAX_TEXT_SHORT, MAX_TEXT_MEDIUM } from "@/lib/utils/validation"

export const clientTypeEnum = z.enum(["individual", "company"])

export const createClientSchema = z.object({
  clientType: clientTypeEnum,
  name: z.string().min(1, "Nombre requerido").max(MAX_TEXT_SHORT).transform(sanitize),
  phone: z.string().max(30).optional(),
  email: z.string().email("Email inválido").max(100).optional().or(z.literal("")),
  cuit: z.string().max(20).optional(),
  notes: z.string().max(MAX_TEXT_MEDIUM).transform(sanitize).optional(),
  // Optional: link individual to a company on creation
  companyId: z.string().uuid().optional().nullable(),
  role: z.string().max(MAX_TEXT_SHORT).optional(),
})

export const updateClientSchema = z.object({
  clientType: clientTypeEnum.optional(),
  name: z.string().min(1, "Nombre requerido").max(MAX_TEXT_SHORT).transform(sanitize).optional(),
  phone: z.string().max(30).nullable().optional(),
  email: z.string().email("Email inválido").max(100).nullable().optional().or(z.literal("")),
  cuit: z.string().max(20).nullable().optional(),
  notes: z.string().max(MAX_TEXT_MEDIUM).transform(sanitize).nullable().optional(),
})

export const clientTypeLabels: Record<z.infer<typeof clientTypeEnum>, string> = {
  individual: "Persona",
  company: "Empresa",
}

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
