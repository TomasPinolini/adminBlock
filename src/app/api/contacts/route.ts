import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { contacts } from "@/lib/db/schema"
import { createContactSchema } from "@/lib/validations/contacts"
import { desc, eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId requerido" },
        { status: 400 }
      )
    }

    const clientContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.clientId, clientId))
      .orderBy(desc(contacts.createdAt))

    return NextResponse.json(clientContacts)
  } catch (error) {
    console.error("Error fetching contacts:", error)
    return NextResponse.json(
      { error: "Error al obtener contactos" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createContactSchema.parse(body)

    const [newContact] = await db
      .insert(contacts)
      .values(validated)
      .returning()

    return NextResponse.json(newContact, { status: 201 })
  } catch (error) {
    console.error("Error creating contact:", error)
    return NextResponse.json(
      { error: "Error al crear contacto" },
      { status: 500 }
    )
  }
}
