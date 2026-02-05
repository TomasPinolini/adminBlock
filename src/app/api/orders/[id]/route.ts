import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders, clients, orderComments } from "@/lib/db/schema"
import { updateOrderSchema } from "@/lib/validations/orders"
import { eq, desc } from "drizzle-orm"

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting order:", error)
    return NextResponse.json(
      { error: "Error al eliminar pedido" },
      { status: 500 }
    )
  }
}
