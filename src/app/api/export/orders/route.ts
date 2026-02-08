import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders, clients } from "@/lib/db/schema"
import { eq, and, gte, lte } from "drizzle-orm"
import { logApiError } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const period = searchParams.get("period") // "month" for current month

    let fromDate: Date | null = null
    let toDate: Date | null = null

    if (period === "month") {
      const now = new Date()
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1)
      toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    } else if (from && to) {
      fromDate = new Date(from)
      toDate = new Date(to)
      toDate.setHours(23, 59, 59, 999)
    }

    // Build query
    let query = db
      .select({
        id: orders.id,
        clientId: orders.clientId,
        serviceType: orders.serviceType,
        status: orders.status,
        description: orders.description,
        price: orders.price,
        dueDate: orders.dueDate,
        paymentStatus: orders.paymentStatus,
        paymentAmount: orders.paymentAmount,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        client: {
          id: clients.id,
          name: clients.name,
          phone: clients.phone,
          email: clients.email,
          clientType: clients.clientType,
        },
      })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))

    // Apply date filters if provided
    if (fromDate && toDate) {
      query = query.where(
        and(
          gte(orders.createdAt, fromDate),
          lte(orders.createdAt, toDate)
        )
      ) as typeof query
    }

    const result = await query.orderBy(orders.createdAt)

    return NextResponse.json(result)
  } catch (error) {
    logApiError("/api/export/orders", "GET", error)
    return NextResponse.json(
      { error: "Error al exportar pedidos" },
      { status: 500 }
    )
  }
}
