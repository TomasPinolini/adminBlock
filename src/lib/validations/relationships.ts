import { z } from "zod"
import { sanitize, MAX_TEXT_SHORT, MAX_TEXT_MEDIUM } from "@/lib/utils/validation"

export const createRelationshipSchema = z.object({
  personId: z.string().uuid("ID de persona inválido"),
  companyId: z.string().uuid("ID de empresa inválido"),
  role: z.string().max(MAX_TEXT_SHORT).transform(sanitize).optional(),
  notes: z.string().max(MAX_TEXT_MEDIUM).transform(sanitize).optional(),
})

export const updateRelationshipSchema = z.object({
  role: z.string().max(MAX_TEXT_SHORT).transform(sanitize).optional(),
  notes: z.string().max(MAX_TEXT_MEDIUM).transform(sanitize).optional(),
})

export type CreateRelationshipInput = z.infer<typeof createRelationshipSchema>
export type UpdateRelationshipInput = z.infer<typeof updateRelationshipSchema>
