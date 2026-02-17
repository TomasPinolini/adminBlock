import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { bulkActionSchema } from "@/lib/validations/bulk"
import { inArray, sql } from "drizzle-orm"
import { z } from "zod"
import { logApiError } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = bulkActionSchema.parse(body)

    const { action, orderIds, newStatus } = validated

    switch (action) {
      case "archive":
        await db
          .update(orders)
          .set({ isArchived: true, archivedAt: new Date() })
          .where(inArray(orders.id, orderIds))
        return NextResponse.json({ success: true, action, count: orderIds.length })

      case "status_change":
        await db.execute(
          sql`UPDATE orders SET status = ${newStatus}, updated_at = NOW() WHERE id = ANY(${orderIds})`
        )
        return NextResponse.json({ success: true, action, count: orderIds.length, newStatus })

      case "delete":
        await db
          .delete(orders)
          .where(inArray(orders.id, orderIds))
        return NextResponse.json({ success: true, action, count: orderIds.length })

      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    logApiError("/api/orders/bulk", "POST", error)
    return NextResponse.json({ error: "Error en operación masiva" }, { status: 500 })
  }
}
