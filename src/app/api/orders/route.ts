import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders, clients } from "@/lib/db/schema"
import { createOrderSchema } from "@/lib/validations/orders"
import { desc, eq } from "drizzle-orm"
import { logActivity } from "@/lib/activity"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const serviceType = searchParams.get("serviceType")
    const clientId = searchParams.get("clientId")
    const includeArchived = searchParams.get("includeArchived") === "true"

    const allOrders = await db
      .select({
        id: orders.id,
        clientId: orders.clientId,
        personId: orders.personId,
        serviceType: orders.serviceType,
        status: orders.status,
        description: orders.description,
        price: orders.price,
        dueDate: orders.dueDate,
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
      .orderBy(desc(orders.createdAt))

    // Filter in JS for now (can optimize with SQL later)
    let filtered = allOrders
    
    // By default, hide archived orders unless explicitly requested
    if (!includeArchived) {
      filtered = filtered.filter((o) => o.isArchived !== "true")
    }
    
    if (clientId) {
      filtered = filtered.filter((o) => o.clientId === clientId)
    }
    if (status && status !== "all") {
      filtered = filtered.filter((o) => o.status === status)
    }
    if (serviceType && serviceType !== "all") {
      filtered = filtered.filter((o) => o.serviceType === serviceType)
    }

    return NextResponse.json(filtered)
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
