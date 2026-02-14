import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clients, orders, orderMaterials, quotes, quoteMaterials, materials, services, suppliers, supplierMaterials, monthlyExpenses, clientRelationships } from "@/lib/db/schema"
import { logApiError } from "@/lib/logger"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    // Verify the user is authenticated (defense in depth — middleware also checks)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const [
      allClients,
      allOrders,
      allOrderMaterials,
      allQuotes,
      allQuoteMaterials,
      allMaterials,
      allServices,
      allSuppliers,
      allSupplierMaterials,
      allMonthlyExpenses,
      allRelationships,
    ] = await Promise.all([
      db.select().from(clients),
      db.select().from(orders),
      db.select().from(orderMaterials),
      db.select().from(quotes),
      db.select().from(quoteMaterials),
      db.select().from(materials),
      db.select().from(services),
      db.select().from(suppliers),
      db.select().from(supplierMaterials),
      db.select().from(monthlyExpenses),
      db.select().from(clientRelationships),
    ])

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      clients: allClients,
      orders: allOrders,
      orderMaterials: allOrderMaterials,
      quotes: allQuotes,
      quoteMaterials: allQuoteMaterials,
      materials: allMaterials,
      services: allServices,
      suppliers: allSuppliers,
      supplierMaterials: allSupplierMaterials,
      monthlyExpenses: allMonthlyExpenses,
      clientRelationships: allRelationships,
    })
  } catch (error) {
    logApiError("/api/backup", "GET", error)
    return NextResponse.json(
      { error: "Error al generar backup" },
      { status: 500 }
    )
  }
}
