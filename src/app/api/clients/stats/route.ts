import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clients, orders } from "@/lib/db/schema"
import { sql, eq, gte, and } from "drizzle-orm"

export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get total clients count
    const [totalResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(clients)

    // Get new clients this month
    const [newThisMonthResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(clients)
      .where(gte(clients.createdAt, startOfMonth))

    // Get top client by revenue (delivered orders only)
    const topClients = await db
      .select({
        id: clients.id,
        name: clients.name,
        totalSpent: sql<string>`COALESCE(SUM(${orders.price}::numeric), 0)::text`,
      })
      .from(clients)
      .leftJoin(
        orders,
        and(eq(clients.id, orders.clientId), eq(orders.status, "delivered"))
      )
      .groupBy(clients.id)
      .orderBy(sql`SUM(${orders.price}::numeric) DESC NULLS LAST`)
      .limit(1)

    // Get total revenue from all delivered orders
    const [revenueResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${orders.price}::numeric), 0)::text`,
      })
      .from(orders)
      .where(eq(orders.status, "delivered"))

    // Get active clients (with orders in the last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [activeResult] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${orders.clientId})::int`,
      })
      .from(orders)
      .where(gte(orders.createdAt, thirtyDaysAgo))

    return NextResponse.json({
      totalClients: totalResult?.count || 0,
      newThisMonth: newThisMonthResult?.count || 0,
      topClient: topClients[0] || null,
      totalRevenue: Number(revenueResult?.total || 0),
      activeClients: activeResult?.count || 0,
    })
  } catch (error) {
    console.error("Error fetching client stats:", error)
    return NextResponse.json(
      { error: "Error al obtener estadisticas" },
      { status: 500 }
    )
  }
}
