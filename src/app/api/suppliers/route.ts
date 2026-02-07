import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { suppliers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const createSupplierSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
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
    console.error("Error fetching suppliers:", error)
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
    console.error("Error creating supplier:", error)
    return NextResponse.json(
      { error: "Error al crear proveedor" },
      { status: 500 }
    )
  }
}
