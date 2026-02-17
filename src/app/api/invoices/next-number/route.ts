import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
import { logApiError } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const { invoiceType, puntoVenta = "00001" } = await request.json()

    if (!invoiceType) {
      return NextResponse.json({ error: "invoiceType es requerido" }, { status: 400 })
    }

    // Atomic increment: returns the number BEFORE incrementing
    const result = await db.execute(
      sql`UPDATE invoice_counters
          SET next_number = next_number + 1, updated_at = NOW()
          WHERE invoice_type = ${invoiceType} AND punto_venta = ${puntoVenta}
          RETURNING next_number - 1 as consumed_number`
    )

    if (!result.length) {
      // Counter doesn't exist, create it and return 1
      await db.execute(
        sql`INSERT INTO invoice_counters (invoice_type, punto_venta, next_number)
            VALUES (${invoiceType}, ${puntoVenta}, 2)`
      )
      return NextResponse.json({ number: 1, puntoVenta, invoiceType })
    }

    const consumedNumber = (result[0] as { consumed_number: number }).consumed_number

    return NextResponse.json({ number: consumedNumber, puntoVenta, invoiceType })
  } catch (error) {
    logApiError("/api/invoices/next-number", "POST", error)
    return NextResponse.json({ error: "Error al obtener número de factura" }, { status: 500 })
  }
}
