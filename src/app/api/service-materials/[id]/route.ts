import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { serviceMaterials } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const updateServiceMaterialSchema = z.object({
  defaultQuantity: z.string().or(z.number()).transform(String).optional(),
  isRequired: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateServiceMaterialSchema.parse(body)

    const [updated] = await db
      .update(serviceMaterials)
      .set(validated)
      .where(eq(serviceMaterials.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { error: "Material de servicio no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error("Error updating service material:", error)
    return NextResponse.json(
      { error: "Error al actualizar material de servicio" },
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
      .delete(serviceMaterials)
      .where(eq(serviceMaterials.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json(
        { error: "Material de servicio no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting service material:", error)
    return NextResponse.json(
      { error: "Error al eliminar material de servicio" },
      { status: 500 }
    )
  }
}
