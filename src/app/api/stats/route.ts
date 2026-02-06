import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { sql, eq, and, gte, lt, notInArray } from "drizzle-orm"

export async function GET() {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const todayStr = today.toISOString().split("T")[0]

    // Execute all queries in parallel for maximum performance
    const [
      todayOrdersResult,
      pendingQuotesResult,
      inProgressResult,
      readyForPickupResult,
      overdueResult,
      dueTodayResult,
      weekRevenueResult,
      monthRevenueResult,
      activeOrdersResult,
    ] = await Promise.all([
      // Today's orders (created today)
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, today),
            lt(orders.createdAt, tomorrow)
          )
        ),

      // Pending quotes
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(orders)
        .where(eq(orders.status, "pending_quote")),

      // In progress
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(orders)
        .where(eq(orders.status, "in_progress")),

      // Ready for pickup
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(orders)
        .where(eq(orders.status, "ready")),

      // Overdue (due date passed, not delivered/cancelled)
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(orders)
        .where(
          and(
            sql`${orders.dueDate} IS NOT NULL`,
            sql`${orders.dueDate} < ${todayStr}`,
            notInArray(orders.status, ["delivered", "cancelled"])
          )
        ),

      // Due today
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(orders)
        .where(
          and(
            eq(orders.dueDate, todayStr),
            notInArray(orders.status, ["delivered", "cancelled"])
          )
        ),

      // Revenue this week (delivered orders)
      db
        .select({ 
          revenue: sql<number>`cast(coalesce(sum(cast(${orders.price} as decimal)), 0) as decimal)` 
        })
        .from(orders)
        .where(
          and(
            eq(orders.status, "delivered"),
            gte(orders.updatedAt, weekStart),
            sql`${orders.price} IS NOT NULL`
          )
        ),

      // Revenue this month (delivered orders)
      db
        .select({ 
          revenue: sql<number>`cast(coalesce(sum(cast(${orders.price} as decimal)), 0) as decimal)` 
        })
        .from(orders)
        .where(
          and(
            eq(orders.status, "delivered"),
            gte(orders.updatedAt, monthStart),
            sql`${orders.price} IS NOT NULL`
          )
        ),

      // Total active orders (not delivered/cancelled)
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(orders)
        .where(notInArray(orders.status, ["delivered", "cancelled"])),
    ])

    const stats = {
      todayOrders: todayOrdersResult[0]?.count || 0,
      pendingQuotes: pendingQuotesResult[0]?.count || 0,
      inProgress: inProgressResult[0]?.count || 0,
      readyForPickup: readyForPickupResult[0]?.count || 0,
      overdue: overdueResult[0]?.count || 0,
      dueToday: dueTodayResult[0]?.count || 0,
      weekRevenue: Number(weekRevenueResult[0]?.revenue || 0),
      monthRevenue: Number(monthRevenueResult[0]?.revenue || 0),
      activeOrders: activeOrdersResult[0]?.count || 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    )
  }
}
