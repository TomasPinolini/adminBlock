import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { contacts } from "@/lib/db/schema"
import { updateContactSchema } from "@/lib/validations/contacts"
import { eq } from "drizzle-orm"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, id))

    if (!contact) {
      return NextResponse.json(
        { error: "Contacto no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error("Error fetching contact:", error)
    return NextResponse.json(
      { error: "Error al obtener contacto" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateContactSchema.parse(body)

    const [updated] = await db
      .update(contacts)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { error: "Contacto no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating contact:", error)
    return NextResponse.json(
      { error: "Error al actualizar contacto" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [deleted] = await db
      .delete(contacts)
      .where(eq(contacts.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json(
        { error: "Contacto no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting contact:", error)
    return NextResponse.json(
      { error: "Error al eliminar contacto" },
      { status: 500 }
    )
  }
}
