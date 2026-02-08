import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { suppliers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { logApiError } from "@/lib/logger"
import { sanitize, MAX_TEXT_SHORT, MAX_TEXT_MEDIUM } from "@/lib/utils/validation"

const createSupplierSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(MAX_TEXT_SHORT).transform(sanitize),
  phone: z.string().max(30).optional(),
  address: z.string().max(MAX_TEXT_MEDIUM).transform(sanitize).optional(),
  notes: z.string().max(MAX_TEXT_MEDIUM).transform(sanitize).optional(),
})

export async function GET() {
  try {
    const allSuppliers = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.isActive, true))
      .orderBy(suppliers.name)

    return NextResponse.json(allSuppliers)
  } catch (error) {
    logApiError("/api/suppliers", "GET", error)
    return NextResponse.json(
      { error: "Error al obtener proveedores" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createSupplierSchema.parse(body)

    const [newSupplier] = await db
      .insert(suppliers)
      .values({
        name: validated.name,
        phone: validated.phone,
        address: validated.address,
        notes: validated.notes,
      })
      .returning()

    return NextResponse.json(newSupplier, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    logApiError("/api/suppliers", "POST", error)
    return NextResponse.json(
      { error: "Error al crear proveedor" },
      { status: 500 }
    )
  }
}
