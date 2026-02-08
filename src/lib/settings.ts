import { db } from "@/lib/db"
import { appSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// Default notification settings
const DEFAULT_SETTINGS: Record<string, string> = {
  "whatsapp.auto.ready": "true",
  "whatsapp.auto.quoted": "true",
  "whatsapp.auto.in_progress": "false",
  "whatsapp.auto.payment": "true",
  "email.auto.ready": "false",
  "email.auto.quoted": "false",
  "email.auto.in_progress": "false",
  "email.auto.payment": "false",
}

export async function getSetting(key: string): Promise<string> {
  try {
    const [setting] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1)

    return setting?.value ?? DEFAULT_SETTINGS[key] ?? ""
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error)
    return DEFAULT_SETTINGS[key] ?? ""
  }
}

export async function isWhatsAppAutoEnabled(status: string): Promise<boolean> {
  const key = `whatsapp.auto.${status}`
  const value = await getSetting(key)
  return value === "true"
}

export async function isPaymentNotificationEnabled(): Promise<boolean> {
  const value = await getSetting("whatsapp.auto.payment")
  return value === "true"
}

export async function isEmailAutoEnabled(status: string): Promise<boolean> {
  const key = `email.auto.${status}`
  const value = await getSetting(key)
  return value === "true"
}

export async function isEmailPaymentNotificationEnabled(): Promise<boolean> {
  const value = await getSetting("email.auto.payment")
  return value === "true"
}
