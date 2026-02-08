import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { services } from "@/lib/db/schema"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { logApiError } from "@/lib/logger"
import { sanitize, MAX_TEXT_SHORT, MAX_TEXT_MEDIUM } from "@/lib/utils/validation"

const updateServiceSchema = z.object({
  name: z.string().min(1).max(MAX_TEXT_SHORT).toLowerCase().optional(),
  displayName: z.string().min(1).max(MAX_TEXT_SHORT).transform(sanitize).optional(),
  description: z.string().max(MAX_TEXT_MEDIUM).transform(sanitize).optional().nullable(),
  sortOrder: z.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, id))
      .limit(1)

    if (!service) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(service)
  } catch (error) {
    logApiError("/api/services/[id]", "GET", error)
    return NextResponse.json(
      { error: "Error al obtener servicio" },
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
    const validated = updateServiceSchema.parse(body)

    const updateData: any = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.displayName !== undefined) updateData.displayName = validated.displayName
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.sortOrder !== undefined) updateData.sortOrder = validated.sortOrder
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive
    
    updateData.updatedAt = new Date()

    const [updated] = await db
      .update(services)
      .set(updateData)
      .where(eq(services.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
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
    logApiError("/api/services/[id]", "PATCH", error)
    return NextResponse.json(
      { error: "Error al actualizar servicio" },
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
    // Soft delete - just mark as inactive
    const [deleted] = await db
      .update(services)
      .set({
        isActive: false, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json(
        { error: "Servicio no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError("/api/services/[id]", "DELETE", error)
    return NextResponse.json(
      { error: "Error al eliminar servicio" },
      { status: 500 }
    )
  }
}
