import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logActivity } from "@/lib/activity"
import { createClient } from "@/lib/supabase/server"

// Archive an order (soft delete)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [updatedOrder] = await db
      .update(orders)
      .set({
        isArchived: "true",
        archivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning()

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      )
    }

    // Log activity
    await logActivity({
      type: "order_updated",
      userId: user?.id,
      userEmail: user?.email,
      entityType: "order",
      entityId: id,
      description: "Pedido archivado",
      metadata: { action: "archived" },
    })

    return NextResponse.json({ success: true, order: updatedOrder })
  } catch (error) {
    console.error("Error archiving order:", error)
    return NextResponse.json(
      { error: "Error al archivar pedido" },
      { status: 500 }
    )
  }
}

// Unarchive an order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [updatedOrder] = await db
      .update(orders)
      .set({
        isArchived: "false",
        archivedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning()

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      )
    }

    // Log activity
    await logActivity({
      type: "order_updated",
      userId: user?.id,
      userEmail: user?.email,
      entityType: "order",
      entityId: id,
      description: "Pedido desarchivado",
      metadata: { action: "unarchived" },
    })

    return NextResponse.json({ success: true, order: updatedOrder })
  } catch (error) {
    console.error("Error unarchiving order:", error)
    return NextResponse.json(
      { error: "Error al desarchivar pedido" },
      { status: 500 }
    )
  }
}
