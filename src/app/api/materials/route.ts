import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { materials } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const createMaterialSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  unit: z.string().min(1, "Unidad requerida"),
  notes: z.string().optional(),
})

export async function GET() {
  try {
    const allMaterials = await db
      .select()
      .from(materials)
      .where(eq(materials.isActive, true))
      .orderBy(materials.name)

    return NextResponse.json(allMaterials)
  } catch (error) {
    console.error("Error fetching materials:", error)
    return NextResponse.json(
      { error: "Error al obtener materiales" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createMaterialSchema.parse(body)

    const [newMaterial] = await db
      .insert(materials)
      .values({
        name: validated.name,
        unit: validated.unit,
        notes: validated.notes,
      })
      .returning()

    return NextResponse.json(newMaterial, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error("Error creating material:", error)
    return NextResponse.json(
      { error: "Error al crear material" },
      { status: 500 }
    )
  }
}
