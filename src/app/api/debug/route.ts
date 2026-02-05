import { NextResponse } from "next/server"

export async function GET() {
  const hasDbUrl = !!process.env.DATABASE_URL
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Show first/last few chars of DATABASE_URL for debugging (hide the password)
  let dbUrlPreview = "not set"
  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL
    dbUrlPreview = url.substring(0, 30) + "..." + url.substring(url.length - 20)
  }

  return NextResponse.json({
    env: {
      DATABASE_URL: hasDbUrl ? dbUrlPreview : "NOT SET",
      NEXT_PUBLIC_SUPABASE_URL: hasSupabaseUrl ? process.env.NEXT_PUBLIC_SUPABASE_URL : "NOT SET",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: hasSupabaseKey ? "SET (hidden)" : "NOT SET",
    },
    timestamp: new Date().toISOString(),
  })
}
