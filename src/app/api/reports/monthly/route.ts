import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders, clients } from "@/lib/db/schema"
import { eq, and, gte, lt, desc } from "drizzle-orm"
import { logApiError } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get("year") || "")
    const month = parseInt(searchParams.get("month") || "")

    if (!year || !month) {
      return NextResponse.json(
        { error: "year and month are required" },
        { status: 400 }
      )
    }

    // Date range for the month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 1) // first day of next month

    const monthOrders = await db
      .select({
        id: orders.id,
        clientId: orders.clientId,
        serviceType: orders.serviceType,
        status: orders.status,
        description: orders.description,
        price: orders.price,
        invoiceNumber: orders.invoiceNumber,
        invoiceType: orders.invoiceType,
        quantity: orders.quantity,
        subtotal: orders.subtotal,
        taxAmount: orders.taxAmount,
        paymentStatus: orders.paymentStatus,
        paymentAmount: orders.paymentAmount,
        createdAt: orders.createdAt,
        clientName: clients.name,
        clientPhone: clients.phone,
        clientCuit: clients.cuit,
      })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .where(
        and(
          gte(orders.createdAt, startDate),
          lt(orders.createdAt, endDate)
        )
      )
      .orderBy(desc(orders.createdAt))

    return NextResponse.json(monthOrders)
  } catch (error) {
    logApiError("/api/reports/monthly", "GET", error)
    return NextResponse.json(
      { error: "Error al obtener reporte mensual" },
      { status: 500 }
    )
  }
}
