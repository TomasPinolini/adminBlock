import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientRelationships } from "@/lib/db/schema"
import { updateRelationshipSchema } from "@/lib/validations/relationships"
import { eq } from "drizzle-orm"
import { logApiError } from "@/lib/logger"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateRelationshipSchema.parse(body)

    const [updated] = await db
      .update(clientRelationships)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(clientRelationships.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { error: "Relación no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    logApiError("/api/relationships/[id]", "PATCH", error)
    return NextResponse.json(
      { error: "Error al actualizar relación" },
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

    const [deleted] = await db
      .delete(clientRelationships)
      .where(eq(clientRelationships.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json(
        { error: "Relación no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError("/api/relationships/[id]", "DELETE", error)
    return NextResponse.json(
      { error: "Error al eliminar relación" },
      { status: 500 }
    )
  }
}
