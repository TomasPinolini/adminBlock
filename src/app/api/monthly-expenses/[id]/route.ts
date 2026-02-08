import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { monthlyExpenses } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { logApiError } from "@/lib/logger"

const updateExpenseSchema = z.object({
  category: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.string().or(z.number()).transform(String).optional(),
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
