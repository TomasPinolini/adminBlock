import { z } from "zod"

export const createRelationshipSchema = z.object({
  personId: z.string().uuid("ID de persona inválido"),
  companyId: z.string().uuid("ID de empresa inválido"),
  role: z.string().optional(),
  notes: z.string().optional(),
})

export const updateRelationshipSchema = z.object({
  role: z.string().optional(),
  notes: z.string().optional(),
})

export type CreateRelationshipInput = z.infer<typeof createRelationshipSchema>
export type UpdateRelationshipInput = z.infer<typeof updateRelationshipSchema>
