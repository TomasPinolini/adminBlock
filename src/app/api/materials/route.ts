import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { materials } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { logApiError } from "@/lib/logger"
import { sanitize, MAX_TEXT_SHORT, MAX_TEXT_MEDIUM } from "@/lib/utils/validation"

const createMaterialSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(MAX_TEXT_SHORT).transform(sanitize),
  unit: z.string().min(1, "Unidad requerida").max(50),
  notes: z.string().max(MAX_TEXT_MEDIUM).transform(sanitize).optional(),
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
    logApiError("/api/materials", "GET", error)
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
    logApiError("/api/materials", "POST", error)
    return NextResponse.json(
      { error: "Error al crear material" },
      { status: 500 }
    )
  }
}
