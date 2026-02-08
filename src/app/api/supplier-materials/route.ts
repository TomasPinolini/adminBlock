import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { supplierMaterials, materials, suppliers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { logApiError } from "@/lib/logger"
import { sanitize, MAX_TEXT_MEDIUM } from "@/lib/utils/validation"

const createSupplierMaterialSchema = z.object({
  supplierId: z.string().uuid("ID de proveedor inválido"),
  materialId: z.string().uuid("ID de material inválido"),
  currentPrice: z.string().or(z.number()).transform(String).refine(
    (val) => { const n = parseFloat(val); return Number.isFinite(n) && n >= 0 },
    { message: "Precio debe ser un número válido (≥ 0)" }
  ).optional(),
  notes: z.string().max(MAX_TEXT_MEDIUM).transform(sanitize).optional(),
})

// Get all supplier materials, optionally filtered by supplierId
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const supplierId = searchParams.get("supplierId")
    const materialId = searchParams.get("materialId")

    let query = db
      .select({
        id: supplierMaterials.id,
        supplierId: supplierMaterials.supplierId,
        materialId: supplierMaterials.materialId,
        currentPrice: supplierMaterials.currentPrice,
        notes: supplierMaterials.notes,
        createdAt: supplierMaterials.createdAt,
        updatedAt: supplierMaterials.updatedAt,
        material: {
          id: materials.id,
          name: materials.name,
          unit: materials.unit,
        },
        supplier: {
          id: suppliers.id,
          name: suppliers.name,
        },
      })
      .from(supplierMaterials)
      .leftJoin(materials, eq(supplierMaterials.materialId, materials.id))
      .leftJoin(suppliers, eq(supplierMaterials.supplierId, suppliers.id))

    if (supplierId) {
      const result = await query.where(eq(supplierMaterials.supplierId, supplierId))
      return NextResponse.json(result)
    }

    if (materialId) {
      const result = await query.where(eq(supplierMaterials.materialId, materialId))
      return NextResponse.json(result)
    }

    const result = await query
    return NextResponse.json(result)
  } catch (error) {
    logApiError("/api/supplier-materials", "GET", error)
    return NextResponse.json(
      { error: "Error al obtener materiales del proveedor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createSupplierMaterialSchema.parse(body)

    const [newSupplierMaterial] = await db
      .insert(supplierMaterials)
      .values({
        supplierId: validated.supplierId,
        materialId: validated.materialId,
        currentPrice: validated.currentPrice,
        notes: validated.notes,
      })
      .returning()

    return NextResponse.json(newSupplierMaterial, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    logApiError("/api/supplier-materials", "POST", error)
    return NextResponse.json(
      { error: "Error al agregar material al proveedor" },
      { status: 500 }
    )
  }
}
