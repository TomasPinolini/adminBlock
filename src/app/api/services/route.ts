import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { services } from "@/lib/db/schema"
import { z } from "zod"
import { asc, eq } from "drizzle-orm"
import { logApiError } from "@/lib/logger"
import { sanitize, MAX_TEXT_SHORT, MAX_TEXT_MEDIUM } from "@/lib/utils/validation"

const createServiceSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(MAX_TEXT_SHORT).toLowerCase(),
  displayName: z.string().min(1, "Nombre de visualización requerido").max(MAX_TEXT_SHORT).transform(sanitize),
  description: z.string().max(MAX_TEXT_MEDIUM).transform(sanitize).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
})

export async function GET() {
  try {
    const allServices = await db
      .select()
      .from(services)
      .where(eq(services.isActive, true))
      .orderBy(asc(services.sortOrder), asc(services.displayName))

    return NextResponse.json(allServices)
  } catch (error) {
    logApiError("/api/services", "GET", error)
    return NextResponse.json(
      { error: "Error al obtener servicios" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createServiceSchema.parse(body)

    const [newService] = await db
      .insert(services)
      .values({
        name: validated.name,
        displayName: validated.displayName,
        description: validated.description || null,
        sortOrder: validated.sortOrder ?? 0,
      })
      .returning()

    return NextResponse.json(newService, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    logApiError("/api/services", "POST", error)
    return NextResponse.json(
      { error: "Error al crear servicio" },
      { status: 500 }
    )
  }
}
