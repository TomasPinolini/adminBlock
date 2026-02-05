import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders, clients, orderComments } from "@/lib/db/schema"
import { updateOrderSchema } from "@/lib/validations/orders"
import { eq, desc } from "drizzle-orm"
import { logActivity } from "@/lib/activity"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [order] = await db
      .select({
        id: orders.id,
        clientId: orders.clientId,
        serviceType: orders.serviceType,
        status: orders.status,
        description: orders.description,
        price: orders.price,
        dueDate: orders.dueDate,
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
      .where(eq(orders.id, id))

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      )
    }

    // Get comments
    const comments = await db
      .select()
      .from(orderComments)
      .where(eq(orderComments.orderId, id))
      .orderBy(desc(orderComments.createdAt))

    return NextResponse.json({ ...order, comments })
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json(
      { error: "Error al obtener pedido" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateOrderSchema.parse(body)

    // Get current order to check for status change
    const [currentOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))

    // Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [updatedOrder] = await db
      .update(orders)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning()

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      )
    }

    // Log activity - check if it was a status change
    const isStatusChange = validated.status && currentOrder?.status !== validated.status
    await logActivity({
      type: isStatusChange ? "order_status_changed" : "order_updated",
      userId: user?.id,
      userEmail: user?.email,
      entityType: "order",
      entityId: id,
      description: isStatusChange
        ? `Estado cambiado: ${currentOrder?.status} → ${validated.status}`
        : "Pedido actualizado",
      metadata: isStatusChange
        ? { from: currentOrder?.status, to: validated.status }
        : validated,
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json(
      { error: "Error al actualizar pedido" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [deletedOrder] = await db
      .delete(orders)
      .where(eq(orders.id, id))
      .returning()

    if (!deletedOrder) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      )
    }

    // Log activity
    await logActivity({
      type: "order_deleted",
      userId: user?.id,
      userEmail: user?.email,
      entityType: "order",
      entityId: id,
      description: `Pedido eliminado: ${deletedOrder.serviceType}`,
      metadata: { serviceType: deletedOrder.serviceType },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting order:", error)
    return NextResponse.json(
      { error: "Error al eliminar pedido" },
      { status: 500 }
    )
  }
}
