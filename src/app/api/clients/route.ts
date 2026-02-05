import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clients, orders } from "@/lib/db/schema"
import { createClientSchema } from "@/lib/validations/clients"
import { desc, eq, sql } from "drizzle-orm"

export async function GET() {
  try {
    // Get all clients with their order statistics
    const allClients = await db
      .select({
        id: clients.id,
        name: clients.name,
        phone: clients.phone,
        instagramHandle: clients.instagramHandle,
        notes: clients.notes,
        createdAt: clients.createdAt,
        orderCount: sql<number>`COALESCE(COUNT(${orders.id}), 0)::int`,
        totalSpent: sql<string>`COALESCE(SUM(CASE WHEN ${orders.status} = 'delivered' THEN ${orders.price}::numeric ELSE 0 END), 0)::text`,
        lastOrderDate: sql<string | null>`MAX(${orders.createdAt})::text`,
      })
      .from(clients)
      .leftJoin(orders, eq(clients.id, orders.clientId))
      .groupBy(clients.id)
      .orderBy(desc(clients.createdAt))

    return NextResponse.json(allClients)
  } catch (error) {
    console.error("Error fetching clients:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Error al obtener clientes", details: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createClientSchema.parse(body)

    const [newClient] = await db
      .insert(clients)
      .values(validated)
      .returning()

    return NextResponse.json(newClient, { status: 201 })
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json(
      { error: "Error al crear cliente" },
      { status: 500 }
    )
  }
}
