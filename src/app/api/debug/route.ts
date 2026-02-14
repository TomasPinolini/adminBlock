import { NextResponse } from "next/server"

// Debug endpoint — only available in development
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const dbUrl = process.env.DATABASE_URL

  let parsed: Record<string, string> = {}
  if (dbUrl) {
    try {
      const url = new URL(dbUrl)
      parsed = {
        protocol: url.protocol,
        username: url.username,
        host: url.hostname,
        port: url.port,
        database: url.pathname.slice(1),
        passwordLength: url.password.length.toString(),
      }
    } catch {
      parsed = { error: "Failed to parse URL" }
    }
  }

  return NextResponse.json({
    databaseUrl: parsed,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT SET",
    timestamp: new Date().toISOString(),
  })
}
