import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clients, orders } from "@/lib/db/schema"
import { sql, eq, gte, and } from "drizzle-orm"
import { logApiError } from "@/lib/logger"

export async function GET() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Execute all queries in parallel for maximum performance
    const [
      totalResult,
      newThisMonthResult,
      topClients,
      revenueResult,
      activeResult,
    ] = await Promise.all([
      // Total clients count
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(clients),

      // New clients this month
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(clients)
        .where(gte(clients.createdAt, startOfMonth)),

      // Top client by revenue (delivered orders only)
      db
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
        .limit(1),

      // Total revenue from all delivered orders
      db
        .select({
          total: sql<string>`COALESCE(SUM(${orders.price}::numeric), 0)::text`,
        })
        .from(orders)
        .where(eq(orders.status, "delivered")),

      // Active clients (with orders in the last 30 days)
      db
        .select({
          count: sql<number>`COUNT(DISTINCT ${orders.clientId})::int`,
        })
        .from(orders)
        .where(gte(orders.createdAt, thirtyDaysAgo)),
    ])

    return NextResponse.json({
      totalClients: totalResult[0]?.count || 0,
      newThisMonth: newThisMonthResult[0]?.count || 0,
      topClient: topClients[0] || null,
      totalRevenue: Number(revenueResult[0]?.total || 0),
      activeClients: activeResult[0]?.count || 0,
    })
  } catch (error) {
    logApiError("/api/clients/stats", "GET", error)
    return NextResponse.json(
      { error: "Error al obtener estadisticas" },
      { status: 500 }
    )
  }
}
