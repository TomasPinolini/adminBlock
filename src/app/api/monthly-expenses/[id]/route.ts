import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { monthlyExpenses } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { logApiError } from "@/lib/logger"
import { sanitize, MAX_TEXT_SHORT, MAX_TEXT_MEDIUM } from "@/lib/utils/validation"

const updateExpenseSchema = z.object({
  category: z.string().min(1).max(MAX_TEXT_SHORT).transform(sanitize).optional(),
  description: z.string().max(MAX_TEXT_MEDIUM).transform(sanitize).optional(),
  amount: z.string().or(z.number()).transform(String).refine(
    (val) => { const n = parseFloat(val); return Number.isFinite(n) && n >= 0 },
    { message: "Monto debe ser un número válido (≥ 0)" }
  ).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateExpenseSchema.parse(body)

    const [updated] = await db
      .update(monthlyExpenses)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(monthlyExpenses.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    logApiError("/api/monthly-expenses/[id]", "PATCH", error)
    return NextResponse.json({ error: "Error al actualizar gasto" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [deleted] = await db
      .delete(monthlyExpenses)
      .where(eq(monthlyExpenses.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError("/api/monthly-expenses/[id]", "DELETE", error)
    return NextResponse.json({ error: "Error al eliminar gasto" }, { status: 500 })
  }
}
