import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { suppliers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { logApiError } from "@/lib/logger"

const updateSupplierSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1)

    if (!supplier) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(supplier)
  } catch (error) {
    logApiError("/api/suppliers/[id]", "GET", error)
    return NextResponse.json(
      { error: "Error al obtener proveedor" },
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
    const validated = updateSupplierSchema.parse(body)

    const [updated] = await db
      .update(suppliers)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
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
    logApiError("/api/suppliers/[id]", "PATCH", error)
    return NextResponse.json(
      { error: "Error al actualizar proveedor" },
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

    // Soft delete
    const [deleted] = await db
      .update(suppliers)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError("/api/suppliers/[id]", "DELETE", error)
    return NextResponse.json(
      { error: "Error al eliminar proveedor" },
      { status: 500 }
    )
  }
}
