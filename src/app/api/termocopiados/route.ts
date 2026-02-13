import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders, clients } from "@/lib/db/schema"
import { createTermocopiadoSchema } from "@/lib/validations/termocopiados"
import { desc, eq, sql } from "drizzle-orm"
import { logActivity } from "@/lib/activity"
import { createClient } from "@/lib/supabase/server"
import { logApiError } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
    const offset = parseInt(searchParams.get("offset") || "0")

    const result = await db
      .select({
        id: orders.id,
        clientId: orders.clientId,
        serviceType: orders.serviceType,
        status: orders.status,
        description: orders.description,
        price: orders.price,
        metadata: orders.metadata,
        paymentStatus: orders.paymentStatus,
        paymentAmount: orders.paymentAmount,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        client: {
          id: clients.id,
          name: clients.name,
          phone: clients.phone,
          email: clients.email,
          cuit: clients.cuit,
          address: clients.address,
        },
      })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .where(eq(orders.serviceType, "termocopiado"))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset)

    // Get daily summary (today's count and total)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const [summary] = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
        total: sql<string>`COALESCE(SUM(${orders.price}::numeric), 0)::text`,
      })
      .from(orders)
      .where(
        sql`${orders.serviceType} = 'termocopiado' AND ${orders.createdAt} >= ${today.toISOString()}`
      )

    return NextResponse.json({
      entries: result,
      summary: {
        todayCount: summary?.count ?? 0,
        todayTotal: summary?.total ?? "0",
      },
    })
  } catch (error) {
    logApiError("/api/termocopiados", "GET", error)
    return NextResponse.json(
      { error: "Error al obtener termocopiados" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createTermocopiadoSchema.parse(body)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [newOrder] = await db
      .insert(orders)
      .values({
        clientId: validated.clientId,
        serviceType: "termocopiado",
        status: "delivered",
        description: `${validated.libros} libros, ${validated.copias} copias`,
        price: validated.precio,
        paymentStatus: "pending",
        metadata: { libros: validated.libros, copias: validated.copias },
      })
      .returning()

    await logActivity({
      type: "order_created",
      userId: user?.id,
      userEmail: user?.email,
      entityType: "order",
      entityId: newOrder.id,
      description: `Termocopiado: ${validated.libros} libros, ${validated.copias} copias`,
      metadata: { serviceType: "termocopiado", libros: validated.libros, copias: validated.copias },
    })

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error) {
    logApiError("/api/termocopiados", "POST", error)
    return NextResponse.json(
      { error: "Error al crear termocopiado" },
      { status: 500 }
    )
  }
}
