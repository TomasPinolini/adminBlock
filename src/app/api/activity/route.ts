import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { activityLogs } from "@/lib/db/schema"
import { desc, eq, and } from "drizzle-orm"
import { logApiError } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get("entityType")
    const entityId = searchParams.get("entityId")
    const limit = parseInt(searchParams.get("limit") || "50", 10)

    let query = db.select().from(activityLogs)

    if (entityType && entityId) {
      query = query.where(
        and(
          eq(activityLogs.entityType, entityType),
          eq(activityLogs.entityId, entityId)
        )
      ) as typeof query
    } else if (entityType) {
      query = query.where(eq(activityLogs.entityType, entityType)) as typeof query
    }

    const logs = await query
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)

    return NextResponse.json(logs)
  } catch (error) {
    logApiError("/api/activity", "GET", error)
    return NextResponse.json(
      { error: "Error al obtener actividad" },
      { status: 500 }
    )
  }
}
