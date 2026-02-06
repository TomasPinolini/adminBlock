import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { quotes, quoteMaterials, materials, suppliers, clients } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { z } from "zod"

const quoteMaterialSchema = z.object({
  materialId: z.string().uuid(),
  supplierId: z.string().uuid().optional(),
  quantity: z.string().or(z.number()).transform(String),
  unitPrice: z.string().or(z.number()).transform(String),
})

const createQuoteSchema = z.object({
  clientId: z.string().uuid().optional(),
  serviceType: z.string().optional(),
  description: z.string().optional(),
  profitMargin: z.string().or(z.number()).transform(String).optional(),
  profitType: z.enum(["fixed", "percentage"]).optional(),
  materials: z.array(quoteMaterialSchema).min(1, "Debe agregar al menos un material"),
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
        orderId: quotes.orderId,
        createdAt: quotes.createdAt,
        updatedAt: quotes.updatedAt,
        clientName: clients.name,
      })
      .from(quotes)
      .leftJoin(clients, eq(quotes.clientId, clients.id))
      .orderBy(desc(quotes.createdAt))

    return NextResponse.json(allQuotes)
  } catch (error) {
    console.error("Error fetching quotes:", error)
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

    // Calculate materials cost
    let materialsCost = 0
    const materialsToInsert = validated.materials.map((m) => {
      const quantity = parseFloat(m.quantity)
      const unitPrice = parseFloat(m.unitPrice)
      const subtotal = quantity * unitPrice
      materialsCost += subtotal
      return {
        materialId: m.materialId,
        supplierId: m.supplierId,
        quantity: m.quantity,
        unitPrice: m.unitPrice,
        subtotal: subtotal.toFixed(2),
      }
    })

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
      })
      .returning()

    // Insert quote materials
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
    console.error("Error creating quote:", error)
    return NextResponse.json(
      { error: "Error al crear cotización" },
      { status: 500 }
    )
  }
}
