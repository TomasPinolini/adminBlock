import { NextRequest, NextResponse } from "next/server"
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

    const edgeFnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`
    const res = await fetch(edgeFnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ to, subject, html }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      console.error("Edge function error:", res.status, data)
      return NextResponse.json(
        { error: data?.error || "Error al enviar email" },
        { status: res.status }
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
