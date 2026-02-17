import { NextRequest, NextResponse } from "next/server"
import { logApiError } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cuit = searchParams.get("cuit")

    if (!cuit || !/^\d{11}$/.test(cuit.replace(/[-\s]/g, ""))) {
      return NextResponse.json({ error: "CUIT inválido" }, { status: 400 })
    }

    const cleaned = cuit.replace(/[-\s]/g, "")
    const res = await fetch(
      `https://afip.tangofactura.com/Rest/GetContribuyente?cuit=${cleaned}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )

    if (!res.ok) {
      return NextResponse.json({ error: "Error al consultar AFIP" }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    logApiError("/api/afip/cuit-lookup", "GET", error)
    return NextResponse.json({ error: "Error al consultar CUIT" }, { status: 500 })
  }
}
