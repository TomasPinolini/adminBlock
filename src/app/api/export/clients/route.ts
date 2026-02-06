import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clients, orders } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

export async function GET() {
  try {
    // Get clients with order count
    const result = await db
      .select({
        id: clients.id,
        name: clients.name,
        clientType: clients.clientType,
        phone: clients.phone,
        instagramHandle: clients.instagramHandle,
        notes: clients.notes,
        createdAt: clients.createdAt,
        orderCount: sql<number>`count(${orders.id})::int`,
        totalSpent: sql<string>`coalesce(sum(${orders.price}::numeric), 0)`,
      })
      .from(clients)
      .leftJoin(orders, eq(clients.id, orders.clientId))
      .groupBy(clients.id)
      .orderBy(clients.name)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error exporting clients:", error)
    return NextResponse.json(
      { error: "Error al exportar clientes" },
      { status: 500 }
    )
  }
}
