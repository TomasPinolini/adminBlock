import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { quotes, quoteMaterials, materials, suppliers, clients } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { z } from "zod"
import { logApiError } from "@/lib/logger"
import { sanitize, MAX_TEXT_SHORT, MAX_TEXT_MEDIUM } from "@/lib/utils/validation"

const positiveNumStr = z.string().or(z.number()).transform(String).refine(
  (val) => { const n = parseFloat(val); return Number.isFinite(n) && n >= 0 },
  { message: "Debe ser un número válido (≥ 0)" }
)

const quoteLineItemSchema = z.object({
  lineType: z.enum(["material", "service"]).default("material"),
  materialId: z.string().uuid().optional(),
  description: z.string().max(MAX_TEXT_MEDIUM).transform(sanitize).optional(),
  supplierId: z.string().uuid().optional(),
  quantity: positiveNumStr,
  unitPrice: positiveNumStr,
})

const createQuoteSchema = z.object({
  clientId: z.string().uuid().optional(),
  serviceType: z.string().max(MAX_TEXT_SHORT).optional(),
  description: z.string().max(MAX_TEXT_MEDIUM).transform(sanitize).optional(),
  profitMargin: positiveNumStr.optional(),
  profitType: z.enum(["fixed", "percentage"]).optional(),
  isOutsourced: z.boolean().optional(),
  outsourcedSupplierId: z.string().uuid().optional(),
  outsourcedCost: positiveNumStr.optional(),
  materials: z.array(quoteLineItemSchema).max(50).optional(),
})

export async function GET() {
  try {
    const allQuotes = await db
      .select({
        id: quotes.id,
        clientId: quotes.clientId,
        serviceType: quotes.serviceType,
        description: quotes.description,
        materialsCost: quotes.materialsCost,
        profitMargin: quotes.profitMargin,
        profitType: quotes.profitType,
        totalPrice: quotes.totalPrice,
        isOutsourced: quotes.isOutsourced,
        outsourcedSupplierId: quotes.outsourcedSupplierId,
        orderId: quotes.orderId,
        createdAt: quotes.createdAt,
        updatedAt: quotes.updatedAt,
        clientName: clients.name,
        supplierName: suppliers.name,
      })
      .from(quotes)
      .leftJoin(clients, eq(quotes.clientId, clients.id))
      .leftJoin(suppliers, eq(quotes.outsourcedSupplierId, suppliers.id))
      .orderBy(desc(quotes.createdAt))

    return NextResponse.json(allQuotes)
  } catch (error) {
    logApiError("/api/quotes", "GET", error)
    return NextResponse.json(
      { error: "Error al obtener cotizaciones" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createQuoteSchema.parse(body)

    let materialsCost = 0
    let materialsToInsert: Array<{
      lineType: string
      materialId?: string
      description?: string
      supplierId?: string
      quantity: string
      unitPrice: string
      subtotal: string
    }> = []

    if (validated.isOutsourced) {
      // Outsourced: cost is the supplier's price
      materialsCost = validated.outsourcedCost ? parseFloat(validated.outsourcedCost) : 0
    } else {
      // Normal: calculate from line items
      if (!validated.materials || validated.materials.length === 0) {
        return NextResponse.json(
          { error: "Debe agregar al menos una línea" },
          { status: 400 }
        )
      }
      materialsToInsert = validated.materials.map((m) => {
        const quantity = parseFloat(m.quantity)
        const unitPrice = parseFloat(m.unitPrice)
        const subtotal = quantity * unitPrice
        materialsCost += subtotal
        return {
          lineType: m.lineType || "material",
          materialId: m.materialId,
          description: m.description,
          supplierId: m.supplierId,
          quantity: m.quantity,
          unitPrice: m.unitPrice,
          subtotal: subtotal.toFixed(2),
        }
      })
    }

    // Calculate total price with profit
    let totalPrice = materialsCost
    const profitMargin = validated.profitMargin ? parseFloat(validated.profitMargin) : 0
    
    if (validated.profitType === "percentage") {
      totalPrice = materialsCost * (1 + profitMargin / 100)
    } else {
      totalPrice = materialsCost + profitMargin
    }

    // Create quote
    const [newQuote] = await db
      .insert(quotes)
      .values({
        clientId: validated.clientId,
        serviceType: validated.serviceType as any,
        description: validated.description,
        materialsCost: materialsCost.toFixed(2),
        profitMargin: validated.profitMargin,
        profitType: validated.profitType || "fixed",
        totalPrice: totalPrice.toFixed(2),
        isOutsourced: validated.isOutsourced || false,
        outsourcedSupplierId: validated.outsourcedSupplierId,
      })
      .returning()

    // Insert line items (only for non-outsourced quotes)
    if (materialsToInsert.length > 0) {
      await db.insert(quoteMaterials).values(
        materialsToInsert.map((m) => ({
          ...m,
          quoteId: newQuote.id,
        }))
      )
    }

    return NextResponse.json(newQuote, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    logApiError("/api/quotes", "POST", error)
    return NextResponse.json(
      { error: "Error al crear cotización" },
      { status: 500 }
    )
  }
}
