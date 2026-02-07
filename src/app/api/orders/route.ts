import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders, clients, type OrderStatus } from "@/lib/db/schema"
import { createOrderSchema } from "@/lib/validations/orders"
import { and, desc, eq, type SQL } from "drizzle-orm"
import { logActivity } from "@/lib/activity"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const serviceType = searchParams.get("serviceType")
    const clientId = searchParams.get("clientId")
    const includeArchived = searchParams.get("includeArchived") === "true"

    // Build WHERE conditions
    const conditions: SQL[] = []
    if (!includeArchived) {
      conditions.push(eq(orders.isArchived, false))
    }
    if (clientId) {
      conditions.push(eq(orders.clientId, clientId))
    }
    if (status && status !== "all") {
      conditions.push(eq(orders.status, status as OrderStatus))
    }
    if (serviceType && serviceType !== "all") {
      conditions.push(eq(orders.serviceType, serviceType))
    }

    const result = await db
      .select({
        id: orders.id,
        clientId: orders.clientId,
        personId: orders.personId,
        serviceType: orders.serviceType,
        status: orders.status,
        description: orders.description,
        price: orders.price,
        dueDate: orders.dueDate,
        invoiceNumber: orders.invoiceNumber,
        invoiceType: orders.invoiceType,
        quantity: orders.quantity,
        subtotal: orders.subtotal,
        taxAmount: orders.taxAmount,
        paymentStatus: orders.paymentStatus,
        paymentAmount: orders.paymentAmount,
        receiptUrl: orders.receiptUrl,
        paidAt: orders.paidAt,
        isArchived: orders.isArchived,
        archivedAt: orders.archivedAt,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        client: {
          id: clients.id,
          name: clients.name,
          phone: clients.phone,
          instagramHandle: clients.instagramHandle,
        },
      })
      .from(orders)
      .leftJoin(clients, eq(orders.clientId, clients.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt))

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { error: "Error al obtener pedidos" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createOrderSchema.parse(body)

    // Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [newOrder] = await db
      .insert(orders)
      .values({
        clientId: validated.clientId,
        personId: validated.personId || null,
        serviceType: validated.serviceType,
        description: validated.description,
        price: validated.price || null,
        dueDate: validated.dueDate || null,
        invoiceNumber: validated.invoiceNumber || null,
        invoiceType: validated.invoiceType || "none",
        quantity: validated.quantity || null,
        subtotal: validated.subtotal || null,
        taxAmount: validated.taxAmount || null,
      })
      .returning()

    // Log activity
    await logActivity({
      type: "order_created",
      userId: user?.id,
      userEmail: user?.email,
      entityType: "order",
      entityId: newOrder.id,
      description: `Pedido creado: ${validated.serviceType}`,
      metadata: { serviceType: validated.serviceType },
    })

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { error: "Error al crear pedido" },
      { status: 500 }
    )
  }
}
