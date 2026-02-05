import { NextResponse } from "next/server"
import postgres from "postgres"

export async function GET() {
  const dbUrl = process.env.DATABASE_URL

  // Parse DATABASE_URL to show components (without password)
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
    } catch (e) {
      parsed = { error: "Failed to parse URL" }
    }
  }

  // Test connection
  let connectionTest = "not attempted"
  if (dbUrl) {
    try {
      const sql = postgres(dbUrl, {
        prepare: false,
        ssl: 'require',
        max: 1,
        connect_timeout: 10,
      })
      const result = await sql`SELECT 1 as test`
      await sql.end()
      connectionTest = "SUCCESS"
    } catch (e) {
      connectionTest = e instanceof Error ? e.message : "Unknown error"
    }
  }

  return NextResponse.json({
    databaseUrl: parsed,
    connectionTest,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT SET",
    timestamp: new Date().toISOString(),
  })
}
