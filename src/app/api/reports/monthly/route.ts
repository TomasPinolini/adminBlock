import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders, clients, orderMaterials, materials, suppliers } from "@/lib/db/schema"
import { eq, and, gte, lt, desc, sql } from "drizzle-orm"
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

    // Get material costs for orders in this month
    const orderIds = monthOrders.map((o) => o.id)
    let materialCosts: Array<{
      id: string
      orderId: string
      lineType: string
      materialName: string | null
      supplierName: string | null
      description: string | null
      quantity: string
      unitPrice: string
      subtotal: string
    }> = []

    if (orderIds.length > 0) {
      materialCosts = await db
        .select({
          id: orderMaterials.id,
          orderId: orderMaterials.orderId,
          lineType: orderMaterials.lineType,
          materialName: materials.name,
          supplierName: suppliers.name,
          description: orderMaterials.description,
          quantity: orderMaterials.quantity,
          unitPrice: orderMaterials.unitPrice,
          subtotal: orderMaterials.subtotal,
        })
        .from(orderMaterials)
        .leftJoin(materials, eq(orderMaterials.materialId, materials.id))
        .leftJoin(suppliers, eq(orderMaterials.supplierId, suppliers.id))
        .where(
          sql`${orderMaterials.orderId} IN (${sql.join(orderIds.map(id => sql`${id}`), sql`, `)})`
        )
    }

    return NextResponse.json({ orders: monthOrders, materialCosts })
  } catch (error) {
    logApiError("/api/reports/monthly", "GET", error)
    return NextResponse.json(
      { error: "Error al obtener reporte mensual" },
      { status: 500 }
    )
  }
}
