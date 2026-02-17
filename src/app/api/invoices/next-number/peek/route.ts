import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { invoiceCounters } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { logApiError } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const invoiceType = searchParams.get("invoiceType")
    const puntoVenta = searchParams.get("puntoVenta") || "00001"

    if (!invoiceType) {
      return NextResponse.json({ error: "invoiceType es requerido" }, { status: 400 })
    }

    const [counter] = await db
      .select()
      .from(invoiceCounters)
      .where(and(
        eq(invoiceCounters.invoiceType, invoiceType),
        eq(invoiceCounters.puntoVenta, puntoVenta)
      ))
      .limit(1)

    return NextResponse.json({
      number: counter?.nextNumber ?? 1,
      puntoVenta,
      invoiceType
    })
  } catch (error) {
    logApiError("/api/invoices/next-number/peek", "GET", error)
    return NextResponse.json({ error: "Error al obtener próximo número" }, { status: 500 })
  }
}
