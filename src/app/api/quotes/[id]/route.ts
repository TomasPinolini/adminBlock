import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { quotes, quoteMaterials, materials, suppliers, orders } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logApiError } from "@/lib/logger"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [quote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, id))
      .limit(1)

    if (!quote) {
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      )
    }

    // Get quote materials with details
    const quoteWithMaterials = await db
      .select({
        id: quoteMaterials.id,
        materialId: quoteMaterials.materialId,
        supplierId: quoteMaterials.supplierId,
        quantity: quoteMaterials.quantity,
        unitPrice: quoteMaterials.unitPrice,
        subtotal: quoteMaterials.subtotal,
        materialName: materials.name,
        materialUnit: materials.unit,
        supplierName: suppliers.name,
      })
      .from(quoteMaterials)
      .leftJoin(materials, eq(quoteMaterials.materialId, materials.id))
      .leftJoin(suppliers, eq(quoteMaterials.supplierId, suppliers.id))
      .where(eq(quoteMaterials.quoteId, id))

    return NextResponse.json({
      ...quote,
      materials: quoteWithMaterials,
    })
  } catch (error) {
    logApiError("/api/quotes/[id]", "GET", error)
    return NextResponse.json(
      { error: "Error al obtener cotización" },
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
      .delete(quotes)
      .where(eq(quotes.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json(
        { error: "Cotización no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError("/api/quotes/[id]", "DELETE", error)
    return NextResponse.json(
      { error: "Error al eliminar cotización" },
      { status: 500 }
    )
  }
}
