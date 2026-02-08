import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { appSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { logApiError } from "@/lib/logger"

// Default notification settings
const DEFAULT_SETTINGS = {
  "whatsapp.auto.ready": "true",
  "whatsapp.auto.quoted": "true",
  "whatsapp.auto.in_progress": "false",
  "whatsapp.auto.payment": "true",
  "email.auto.ready": "false",
  "email.auto.quoted": "false",
  "email.auto.in_progress": "false",
  "email.auto.payment": "false",
}

export async function GET() {
  try {
    const settings = await db.select().from(appSettings)
    
    // Merge with defaults
    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS }
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value
    }

    return NextResponse.json(settingsMap)
  } catch (error) {
    logApiError("/api/settings", "GET", error)
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "Clave y valor son requeridos" },
        { status: 400 }
      )
    }

    // Upsert the setting
    const existing = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(appSettings)
        .set({ value: String(value), updatedAt: new Date() })
        .where(eq(appSettings.key, key))
    } else {
      await db.insert(appSettings).values({
        key,
        value: String(value),
      })
    }

    return NextResponse.json({ success: true, key, value })
  } catch (error) {
    logApiError("/api/settings", "PATCH", error)
    return NextResponse.json(
      { error: "Error al actualizar configuración" },
      { status: 500 }
    )
  }
}
