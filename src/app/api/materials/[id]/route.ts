import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { materials } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const updateMaterialSchema = z.object({
  name: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [material] = await db
      .select()
      .from(materials)
      .where(eq(materials.id, id))
      .limit(1)

    if (!material) {
      return NextResponse.json(
        { error: "Material no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(material)
  } catch (error) {
    console.error("Error fetching material:", error)
    return NextResponse.json(
      { error: "Error al obtener material" },
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
    const validated = updateMaterialSchema.parse(body)

    const [updated] = await db
      .update(materials)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(materials.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { error: "Material no encontrado" },
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
    console.error("Error updating material:", error)
    return NextResponse.json(
      { error: "Error al actualizar material" },
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

    // Soft delete - set isActive to false
    const [deleted] = await db
      .update(materials)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(materials.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json(
        { error: "Material no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting material:", error)
    return NextResponse.json(
      { error: "Error al eliminar material" },
      { status: 500 }
    )
  }
}
