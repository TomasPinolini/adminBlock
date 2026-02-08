import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { monthlyExpenses } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { z } from "zod"
import { logApiError } from "@/lib/logger"

const createExpenseSchema = z.object({
  year: z.number().int().min(2020).max(2099),
  month: z.number().int().min(1).max(12),
  category: z.string().min(1),
  description: z.string().optional(),
  amount: z.string().or(z.number()).transform(String),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get("year") || "")
    const month = parseInt(searchParams.get("month") || "")

    if (!year || !month) {
      return NextResponse.json(
        { error: "year and month are required" },
        { status: 400 }
      )
    }

    const expenses = await db
      .select()
      .from(monthlyExpenses)
      .where(
        and(
          eq(monthlyExpenses.year, year),
          eq(monthlyExpenses.month, month)
        )
      )
      .orderBy(desc(monthlyExpenses.createdAt))

    return NextResponse.json(expenses)
  } catch (error) {
    logApiError("/api/monthly-expenses", "GET", error)
    return NextResponse.json(
      { error: "Error al obtener gastos" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createExpenseSchema.parse(body)

    const [newExpense] = await db
      .insert(monthlyExpenses)
      .values({
        year: validated.year,
        month: validated.month,
        category: validated.category,
        description: validated.description,
        amount: validated.amount,
      })
      .returning()

    return NextResponse.json(newExpense, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    logApiError("/api/monthly-expenses", "POST", error)
    return NextResponse.json(
      { error: "Error al crear gasto" },
      { status: 500 }
    )
  }
}
