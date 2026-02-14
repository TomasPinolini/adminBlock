import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clients, orders, quotes } from "@/lib/db/schema"
import { updateClientSchema } from "@/lib/validations/clients"
import { z } from "zod"
import { eq, count } from "drizzle-orm"
import { logApiError } from "@/lib/logger"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, id))

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    logApiError("/api/clients/[id]", "GET", error)
    return NextResponse.json(
      { error: "Error al obtener cliente" },
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
    const validated = updateClientSchema.parse(body)

    const [updatedClient] = await db
      .update(clients)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning()

    if (!updatedClient) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedClient)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    logApiError("/api/clients/[id]", "PATCH", error)
    return NextResponse.json(
      { error: "Error al actualizar cliente" },
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

    // Check for existing orders/quotes that reference this client (FK constraint)
    const [[orderCount], [quoteCount]] = await Promise.all([
      db.select({ n: count() }).from(orders).where(eq(orders.clientId, id)),
      db.select({ n: count() }).from(quotes).where(eq(quotes.clientId, id)),
    ])

    const totalRefs = (orderCount?.n ?? 0) + (quoteCount?.n ?? 0)
    if (totalRefs > 0) {
      const parts: string[] = []
      if (orderCount?.n) parts.push(`${orderCount.n} pedido${orderCount.n > 1 ? "s" : ""}`)
      if (quoteCount?.n) parts.push(`${quoteCount.n} cotización${quoteCount.n > 1 ? "es" : ""}`)
      return NextResponse.json(
        { error: `No se puede eliminar: el cliente tiene ${parts.join(" y ")}` },
        { status: 409 }
      )
    }

    const [deletedClient] = await db
      .delete(clients)
      .where(eq(clients.id, id))
      .returning()

    if (!deletedClient) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logApiError("/api/clients/[id]", "DELETE", error)
    return NextResponse.json(
      { error: "Error al eliminar cliente" },
      { status: 500 }
    )
  }
}
