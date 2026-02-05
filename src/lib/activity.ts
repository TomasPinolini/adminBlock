import { db } from "./db"
import { activityLogs, ActivityType } from "./db/schema"

type LogActivityParams = {
  type: ActivityType
  userId?: string
  userEmail?: string
  entityType: "order" | "client"
  entityId: string
  description: string
  metadata?: Record<string, unknown>
}

export async function logActivity({
  type,
  userId,
  userEmail,
  entityType,
  entityId,
  description,
  metadata,
}: LogActivityParams) {
  try {
    await db.insert(activityLogs).values({
      activityType: type,
      userId,
      userEmail,
      entityType,
      entityId,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
    })
  } catch (error) {
    // Don't fail the main operation if logging fails
    console.error("Failed to log activity:", error)
  }
}

// Helper to format activity descriptions in Spanish
export function formatActivityDescription(
  type: ActivityType,
  entityName?: string
): string {
  const descriptions: Record<ActivityType, string> = {
    order_created: `Pedido creado${entityName ? ` para ${entityName}` : ""}`,
    order_updated: "Pedido actualizado",
    order_status_changed: "Estado del pedido cambiado",
    order_deleted: "Pedido eliminado",
    order_duplicated: `Pedido duplicado${entityName ? ` de ${entityName}` : ""}`,
    client_created: `Cliente creado: ${entityName || ""}`,
    client_updated: `Cliente actualizado: ${entityName || ""}`,
    client_deleted: `Cliente eliminado: ${entityName || ""}`,
    comment_added: "Comentario agregado",
  }
  return descriptions[type]
}
