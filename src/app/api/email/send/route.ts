import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logApiError } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html } = await request.json()

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Faltan campos: to, subject, html" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.functions.invoke("send-email", {
      body: { to, subject, html },
    })

    if (error) {
      console.error("Edge function error:", error)
      return NextResponse.json(
        { error: error.message || "Error al enviar email" },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    logApiError("/api/email/send", "POST", error)
    return NextResponse.json(
      { error: "Error al enviar email" },
      { status: 500 }
    )
  }
}
