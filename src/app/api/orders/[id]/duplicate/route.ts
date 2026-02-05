import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logActivity } from "@/lib/activity"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get the original order
    const [originalOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))

    if (!originalOrder) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      )
    }

    // Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Create duplicate with reset status and no price
    const [newOrder] = await db
      .insert(orders)
      .values({
        clientId: originalOrder.clientId,
        serviceType: originalOrder.serviceType,
        description: originalOrder.description,
        price: null, // Reset price for new quote
        dueDate: null, // Reset due date
        status: "pending_quote", // Start fresh
      })
      .returning()

    // Log activity
    await logActivity({
      type: "order_duplicated",
      userId: user?.id,
      userEmail: user?.email,
      entityType: "order",
      entityId: newOrder.id,
      description: `Pedido duplicado de #${id.slice(0, 8)}`,
      metadata: { originalOrderId: id },
    })

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error) {
    console.error("Error duplicating order:", error)
    return NextResponse.json(
      { error: "Error al duplicar pedido" },
      { status: 500 }
    )
  }
}
