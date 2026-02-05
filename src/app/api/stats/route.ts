import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { sql, eq, and, gte, lte, ne } from "drizzle-orm"

export async function GET() {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get all orders for calculations
    const allOrders = await db.select().from(orders)

    // Calculate stats
    const todayStr = today.toISOString().split("T")[0]
    const tomorrowStr = tomorrow.toISOString().split("T")[0]

    const stats = {
      // Today's orders (created today)
      todayOrders: allOrders.filter(o => {
        const created = new Date(o.createdAt)
        return created >= today && created < tomorrow
      }).length,

      // Pending quotes
      pendingQuotes: allOrders.filter(o => o.status === "pending_quote").length,

      // In progress
      inProgress: allOrders.filter(o => o.status === "in_progress").length,

      // Ready for pickup
      readyForPickup: allOrders.filter(o => o.status === "ready").length,

      // Overdue (due date passed, not delivered/cancelled)
      overdue: allOrders.filter(o => {
        if (!o.dueDate) return false
        if (o.status === "delivered" || o.status === "cancelled") return false
        return new Date(o.dueDate) < today
      }).length,

      // Due today
      dueToday: allOrders.filter(o => {
        if (!o.dueDate) return false
        if (o.status === "delivered" || o.status === "cancelled") return false
        return o.dueDate === todayStr
      }).length,

      // Revenue this week (delivered orders)
      weekRevenue: allOrders
        .filter(o => {
          if (o.status !== "delivered" || !o.price) return false
          const updated = new Date(o.updatedAt)
          return updated >= weekStart
        })
        .reduce((sum, o) => sum + Number(o.price), 0),

      // Revenue this month (delivered orders)
      monthRevenue: allOrders
        .filter(o => {
          if (o.status !== "delivered" || !o.price) return false
          const updated = new Date(o.updatedAt)
          return updated >= monthStart
        })
        .reduce((sum, o) => sum + Number(o.price), 0),

      // Total active orders (not delivered/cancelled)
      activeOrders: allOrders.filter(o =>
        o.status !== "delivered" && o.status !== "cancelled"
      ).length,
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
