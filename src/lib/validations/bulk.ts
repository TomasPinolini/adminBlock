import { z } from "zod"

export const bulkActionSchema = z.object({
  action: z.enum(["archive", "status_change", "delete"]),
  orderIds: z.array(z.string().uuid()).min(1).max(50),
  newStatus: z.string().optional(),
}).refine(
  (data) => data.action !== "status_change" || !!data.newStatus,
  { message: "newStatus es requerido para cambio de estado", path: ["newStatus"] }
)

export type BulkAction = z.infer<typeof bulkActionSchema>
