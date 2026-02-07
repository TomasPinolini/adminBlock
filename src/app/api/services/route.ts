import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { services } from "@/lib/db/schema"
import { z } from "zod"
import { asc, eq } from "drizzle-orm"

const createServiceSchema = z.object({
  name: z.string().min(1, "Nombre requerido").toLowerCase(),
  displayName: z.string().min(1, "Nombre de visualización requerido"),
  description: z.string().optional(),
  sortOrder: z.number().optional(),
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
    console.error("Error fetching services:", error)
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
        sortOrder: validated.sortOrder?.toString() || "0",
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
    console.error("Error creating service:", error)
    return NextResponse.json(
      { error: "Error al crear servicio" },
      { status: 500 }
    )
  }
}
