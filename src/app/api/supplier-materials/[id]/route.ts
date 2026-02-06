import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { supplierMaterials } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const updateSupplierMaterialSchema = z.object({
  currentPrice: z.string().or(z.number()).transform(String).optional(),
  notes: z.string().optional().nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateSupplierMaterialSchema.parse(body)

    const [updated] = await db
      .update(supplierMaterials)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(supplierMaterials.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { error: "Material de proveedor no encontrado" },
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
    console.error("Error updating supplier material:", error)
    return NextResponse.json(
      { error: "Error al actualizar material del proveedor" },
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
      .delete(supplierMaterials)
      .where(eq(supplierMaterials.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json(
        { error: "Material de proveedor no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting supplier material:", error)
    return NextResponse.json(
      { error: "Error al eliminar material del proveedor" },
      { status: 500 }
    )
  }
}
