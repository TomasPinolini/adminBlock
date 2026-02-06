import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { serviceMaterials, materials } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const createServiceMaterialSchema = z.object({
  serviceType: z.string().min(1, "Tipo de servicio requerido"),
  materialId: z.string().uuid("ID de material inválido"),
  defaultQuantity: z.string().or(z.number()).transform(String).optional(),
  isRequired: z.string().optional(),
})

// Get all service materials, optionally filtered by serviceType
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const serviceType = searchParams.get("serviceType")

    let query = db
      .select({
        id: serviceMaterials.id,
        serviceType: serviceMaterials.serviceType,
        materialId: serviceMaterials.materialId,
        defaultQuantity: serviceMaterials.defaultQuantity,
        isRequired: serviceMaterials.isRequired,
        createdAt: serviceMaterials.createdAt,
        material: {
          id: materials.id,
          name: materials.name,
          unit: materials.unit,
        },
      })
      .from(serviceMaterials)
      .leftJoin(materials, eq(serviceMaterials.materialId, materials.id))

    if (serviceType) {
      const result = await query.where(
        eq(serviceMaterials.serviceType, serviceType as any)
      )
      return NextResponse.json(result)
    }

    const result = await query
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching service materials:", error)
    return NextResponse.json(
      { error: "Error al obtener materiales de servicio" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createServiceMaterialSchema.parse(body)

    const [newServiceMaterial] = await db
      .insert(serviceMaterials)
      .values({
        serviceType: validated.serviceType as any,
        materialId: validated.materialId,
        defaultQuantity: validated.defaultQuantity,
        isRequired: validated.isRequired || "false",
      })
      .returning()

    return NextResponse.json(newServiceMaterial, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error("Error creating service material:", error)
    return NextResponse.json(
      { error: "Error al crear material de servicio" },
      { status: 500 }
    )
  }
}
