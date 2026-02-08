import { NextRequest, NextResponse } from "next/server"
import { sendWhatsApp } from "@/lib/whatsapp"

// Test endpoint - DELETE THIS IN PRODUCTION
export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json()

    if (!to || !message) {
      return NextResponse.json(
        { error: "Faltan los campos 'to' o 'message'" },
        { status: 400 }
      )
    }

    const result = await sendWhatsApp({ to, message })

    return NextResponse.json({
      success: true,
      messageSid: result.sid,
    })
  } catch (error) {
    console.error("WhatsApp test error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}
