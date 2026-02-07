import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { quotes, quoteMaterials, orders, orderMaterials } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logApiError } from "@/lib/logger"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get the quote
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

    if (quote.orderId) {
      return NextResponse.json(
        { error: "Esta cotización ya tiene un pedido asociado" },
        { status: 400 }
      )
    }

    if (!quote.clientId) {
      return NextResponse.json(
        { error: "La cotización debe tener un cliente para crear un pedido" },
        { status: 400 }
      )
    }

    // Get quote materials
    const qMaterials = await db
      .select()
      .from(quoteMaterials)
      .where(eq(quoteMaterials.quoteId, id))

    // Create the order
    const [newOrder] = await db
      .insert(orders)
      .values({
        clientId: quote.clientId,
        serviceType: quote.serviceType || "copiado",
        status: "quoted" as const,
        description: quote.description,
        price: quote.totalPrice,
      })
      .returning()

    // Copy line items to order
    if (qMaterials.length > 0) {
      await db.insert(orderMaterials).values(
        qMaterials.map((m) => ({
          orderId: newOrder.id,
          lineType: m.lineType || "material",
          materialId: m.materialId,
          description: m.description,
          supplierId: m.supplierId,
          quantity: m.quantity,
          unitPrice: m.unitPrice,
          subtotal: m.subtotal,
        }))
      )
    }

    // Update quote with order reference
    await db
      .update(quotes)
      .set({
        orderId: newOrder.id,
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, id))

    return NextResponse.json({
      success: true,
      order: newOrder,
    })
  } catch (error) {
    logApiError("/api/quotes/[id]/create-order", "POST", error)
    return NextResponse.json(
      { error: "Error al crear pedido desde cotización" },
      { status: 500 }
    )
  }
}
