import { NextResponse } from "next/server"

// This test endpoint has been disabled for security.
// WhatsApp sending is handled internally by order status change notifications.
export async function POST() {
  return NextResponse.json(
    { error: "Este endpoint fue deshabilitado" },
    { status: 404 }
  )
}
