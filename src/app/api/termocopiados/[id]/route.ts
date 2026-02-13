import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders, quotes } from "@/lib/db/schema"
import { updateTermocopiadoSchema } from "@/lib/validations/termocopiados"
import { eq } from "drizzle-orm"
import { logActivity } from "@/lib/activity"
import { createClient } from "@/lib/supabase/server"
import { logApiError } from "@/lib/logger"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateTermocopiadoSchema.parse(body)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get current order to merge metadata
    const [current] = await db
      .select({ metadata: orders.metadata })
      .from(orders)
      .where(eq(orders.id, id))

    if (!current) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    const currentMeta = (current.metadata as { libros?: number; copias?: number }) || {}
    const newLibros = validated.libros ?? currentMeta.libros
    const newCopias = validated.copias ?? currentMeta.copias

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (validated.libros !== undefined || validated.copias !== undefined) {
      updateData.metadata = { libros: newLibros, copias: newCopias }
      updateData.description = `${newLibros} libros, ${newCopias} copias`
    }
    if (validated.precio !== undefined) {
      updateData.price = validated.precio
    }
    if (validated.paymentStatus !== undefined) {
      updateData.paymentStatus = validated.paymentStatus
    }

    const [updated] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    await logActivity({
      type: "order_updated",
      userId: user?.id,
      userEmail: user?.email,
      entityType: "order",
      entityId: id,
      description: "Termocopiado actualizado",
    })

    return NextResponse.json(updated)
  } catch (error) {
    logApiError("/api/termocopiados/[id]", "PATCH", error)
    return NextResponse.json(
      { error: "Error al actualizar termocopiado" },
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

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Unlink any quotes referencing this order
    await db.update(quotes).set({ orderId: null }).where(eq(quotes.orderId, id))

    const [deleted] = await db
      .delete(orders)
      .where(eq(orders.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    }

    await logActivity({
      type: "order_deleted",
      userId: user?.id,
      userEmail: user?.email,
      entityType: "order",
      entityId: id,
      description: "Termocopiado eliminado",
      metadata: { serviceType: "termocopiado" },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError("/api/termocopiados/[id]", "DELETE", error)
    return NextResponse.json(
      { error: "Error al eliminar termocopiado" },
      { status: 500 }
    )
  }
}
