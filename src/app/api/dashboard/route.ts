import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders, clients, services, orderMaterials, quotes, suppliers, monthlyExpenses } from "@/lib/db/schema"
import { sql, eq, and, or, isNull } from "drizzle-orm"
import { logApiError } from "@/lib/logger"

export async function GET() {
  try {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-indexed

    // Previous month
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear

    // 6 months ago for trends
    const sixMonthsAgo = new Date(currentYear, now.getMonth() - 5, 1)

    // Date range helpers for current/previous month
    const currentMonthStart = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`
    const nextMonthStart = currentMonth === 12
      ? `${currentYear + 1}-01-01`
      : `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`
    const prevMonthStart = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`

    const [
      kpiData,
      prevKpiData,
      overdueCount,
      pendingQuotesCount,
      activeOrdersCount,
      currentMonthExpenses,
      prevMonthExpenses,
      monthlyTrends,
      monthlyOrderCounts,
      monthlyMaterialCosts,
      monthlyOutsourcedCosts,
      monthlyManualExpenses,
      topClients,
      topServices,
    ] = await Promise.all([
      // Current month revenue + order count
      db.select({
        revenue: sql<string>`coalesce(sum(${orders.price}::numeric), 0)`,
        orderCount: sql<number>`count(*)::int`,
      })
        .from(orders)
        .where(and(
          sql`${orders.createdAt} >= ${currentMonthStart}::timestamp`,
          sql`${orders.createdAt} < ${nextMonthStart}::timestamp`,
          or(eq(orders.isArchived, false), isNull(orders.isArchived)),
        )),

      // Previous month revenue + order count
      db.select({
        revenue: sql<string>`coalesce(sum(${orders.price}::numeric), 0)`,
        orderCount: sql<number>`count(*)::int`,
      })
        .from(orders)
        .where(and(
          sql`${orders.createdAt} >= ${prevMonthStart}::timestamp`,
          sql`${orders.createdAt} < ${currentMonthStart}::timestamp`,
          or(eq(orders.isArchived, false), isNull(orders.isArchived)),
        )),

      // Overdue orders (have due_date before today, not delivered/cancelled)
      db.select({
        count: sql<number>`count(*)::int`,
      })
        .from(orders)
        .where(and(
          sql`${orders.dueDate} < current_date`,
          sql`${orders.status} NOT IN ('delivered', 'cancelled')`,
          or(eq(orders.isArchived, false), isNull(orders.isArchived)),
        )),

      // Pending quotes
      db.select({
        count: sql<number>`count(*)::int`,
      })
        .from(orders)
        .where(and(
          eq(orders.status, "pending_quote"),
          or(eq(orders.isArchived, false), isNull(orders.isArchived)),
        )),

      // Active orders (not delivered, not cancelled, not archived)
      db.select({
        count: sql<number>`count(*)::int`,
      })
        .from(orders)
        .where(and(
          sql`${orders.status} NOT IN ('delivered', 'cancelled')`,
          or(eq(orders.isArchived, false), isNull(orders.isArchived)),
        )),

      // Current month expenses - material costs
      db.select({
        materialCosts: sql<string>`coalesce(sum(${orderMaterials.subtotal}::numeric), 0)`,
      })
        .from(orderMaterials)
        .innerJoin(orders, eq(orderMaterials.orderId, orders.id))
        .where(and(
          sql`${orders.createdAt} >= ${currentMonthStart}::timestamp`,
          sql`${orders.createdAt} < ${nextMonthStart}::timestamp`,
        )),

      // Previous month expenses - material costs
      db.select({
        materialCosts: sql<string>`coalesce(sum(${orderMaterials.subtotal}::numeric), 0)`,
      })
        .from(orderMaterials)
        .innerJoin(orders, eq(orderMaterials.orderId, orders.id))
        .where(and(
          sql`${orders.createdAt} >= ${prevMonthStart}::timestamp`,
          sql`${orders.createdAt} < ${currentMonthStart}::timestamp`,
        )),

      // Monthly revenue trends (6 months)
      db.select({
        month: sql<number>`extract(month from ${orders.createdAt})::int`,
        year: sql<number>`extract(year from ${orders.createdAt})::int`,
        revenue: sql<string>`coalesce(sum(${orders.price}::numeric), 0)`,
      })
        .from(orders)
        .where(and(
          sql`${orders.createdAt} >= ${sixMonthsAgo.toISOString()}::timestamp`,
          or(eq(orders.isArchived, false), isNull(orders.isArchived)),
        ))
        .groupBy(
          sql`extract(year from ${orders.createdAt})`,
          sql`extract(month from ${orders.createdAt})`,
        ),

      // Monthly order counts (6 months)
      db.select({
        month: sql<number>`extract(month from ${orders.createdAt})::int`,
        year: sql<number>`extract(year from ${orders.createdAt})::int`,
        orderCount: sql<number>`count(*)::int`,
      })
        .from(orders)
        .where(and(
          sql`${orders.createdAt} >= ${sixMonthsAgo.toISOString()}::timestamp`,
          or(eq(orders.isArchived, false), isNull(orders.isArchived)),
        ))
        .groupBy(
          sql`extract(year from ${orders.createdAt})`,
          sql`extract(month from ${orders.createdAt})`,
        ),

      // Monthly material costs (6 months)
      db.select({
        month: sql<number>`extract(month from ${orders.createdAt})::int`,
        year: sql<number>`extract(year from ${orders.createdAt})::int`,
        materialCosts: sql<string>`coalesce(sum(${orderMaterials.subtotal}::numeric), 0)`,
      })
        .from(orderMaterials)
        .innerJoin(orders, eq(orderMaterials.orderId, orders.id))
        .where(sql`${orders.createdAt} >= ${sixMonthsAgo.toISOString()}::timestamp`)
        .groupBy(
          sql`extract(year from ${orders.createdAt})`,
          sql`extract(month from ${orders.createdAt})`,
        ),

      // Monthly outsourced costs (6 months)
      db.select({
        month: sql<number>`extract(month from ${orders.createdAt})::int`,
        year: sql<number>`extract(year from ${orders.createdAt})::int`,
        outsourcedCosts: sql<string>`coalesce(sum(${quotes.materialsCost}::numeric), 0)`,
      })
        .from(quotes)
        .innerJoin(orders, eq(quotes.orderId, orders.id))
        .where(and(
          sql`${orders.createdAt} >= ${sixMonthsAgo.toISOString()}::timestamp`,
          eq(quotes.isOutsourced, true),
        ))
        .groupBy(
          sql`extract(year from ${orders.createdAt})`,
          sql`extract(month from ${orders.createdAt})`,
        ),

      // Monthly manual expenses (6 months)
      db.select({
        month: monthlyExpenses.month,
        year: monthlyExpenses.year,
        manualExpenses: sql<string>`coalesce(sum(${monthlyExpenses.amount}::numeric), 0)`,
      })
        .from(monthlyExpenses)
        .where(sql`(${monthlyExpenses.year} * 12 + ${monthlyExpenses.month}) >= (${sixMonthsAgo.getFullYear()} * 12 + ${sixMonthsAgo.getMonth() + 1})`)
        .groupBy(monthlyExpenses.year, monthlyExpenses.month),

      // Top 5 clients by revenue (current month)
      db.select({
        clientId: orders.clientId,
        clientName: clients.name,
        revenue: sql<string>`coalesce(sum(${orders.price}::numeric), 0)`,
        orderCount: sql<number>`count(*)::int`,
      })
        .from(orders)
        .leftJoin(clients, eq(orders.clientId, clients.id))
        .where(and(
          sql`${orders.createdAt} >= ${currentMonthStart}::timestamp`,
          sql`${orders.createdAt} < ${nextMonthStart}::timestamp`,
          or(eq(orders.isArchived, false), isNull(orders.isArchived)),
        ))
        .groupBy(orders.clientId, clients.name)
        .orderBy(sql`sum(${orders.price}::numeric) desc nulls last`)
        .limit(5),

      // Top 5 services by revenue (current month)
      db.select({
        serviceType: orders.serviceType,
        displayName: services.displayName,
        revenue: sql<string>`coalesce(sum(${orders.price}::numeric), 0)`,
        orderCount: sql<number>`count(*)::int`,
      })
        .from(orders)
        .leftJoin(services, eq(orders.serviceType, services.name))
        .where(and(
          sql`${orders.createdAt} >= ${currentMonthStart}::timestamp`,
          sql`${orders.createdAt} < ${nextMonthStart}::timestamp`,
          or(eq(orders.isArchived, false), isNull(orders.isArchived)),
        ))
        .groupBy(orders.serviceType, services.displayName)
        .orderBy(sql`sum(${orders.price}::numeric) desc nulls last`)
        .limit(5),
    ])

    // Get outsourced costs for current and prev month from the trends data
    const currentOutsourcedRow = monthlyOutsourcedCosts.find(
      (r) => r.month === currentMonth && r.year === currentYear
    )
    const prevOutsourcedRow = monthlyOutsourcedCosts.find(
      (r) => r.month === prevMonth && r.year === prevYear
    )
    const currentManualRow = monthlyManualExpenses.find(
      (r) => r.month === currentMonth && r.year === currentYear
    )
    const prevManualRow = monthlyManualExpenses.find(
      (r) => r.month === prevMonth && r.year === prevYear
    )

    const currentTotalExpenses =
      Number(currentMonthExpenses[0]?.materialCosts || 0) +
      Number(currentOutsourcedRow?.outsourcedCosts || 0) +
      Number(currentManualRow?.manualExpenses || 0)

    const prevTotalExpenses =
      Number(prevMonthExpenses[0]?.materialCosts || 0) +
      Number(prevOutsourcedRow?.outsourcedCosts || 0) +
      Number(prevManualRow?.manualExpenses || 0)

    // Build 6-month trend array
    const monthLabels = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
    ]

    const trends = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, now.getMonth() - i, 1)
      const m = d.getMonth() + 1
      const y = d.getFullYear()

      const revenueRow = monthlyTrends.find((r) => r.month === m && r.year === y)
      const orderRow = monthlyOrderCounts.find((r) => r.month === m && r.year === y)
      const matRow = monthlyMaterialCosts.find((r) => r.month === m && r.year === y)
      const outRow = monthlyOutsourcedCosts.find((r) => r.month === m && r.year === y)
      const manRow = monthlyManualExpenses.find((r) => r.month === m && r.year === y)

      trends.push({
        month: m,
        year: y,
        label: monthLabels[m - 1],
        revenue: Number(revenueRow?.revenue || 0),
        expenses:
          Number(matRow?.materialCosts || 0) +
          Number(outRow?.outsourcedCosts || 0) +
          Number(manRow?.manualExpenses || 0),
        orderCount: orderRow?.orderCount || 0,
      })
    }

    return NextResponse.json({
      kpis: {
        monthRevenue: Number(kpiData[0]?.revenue || 0),
        prevMonthRevenue: Number(prevKpiData[0]?.revenue || 0),
        monthOrders: kpiData[0]?.orderCount || 0,
        prevMonthOrders: prevKpiData[0]?.orderCount || 0,
        monthExpenses: currentTotalExpenses,
        prevMonthExpenses: prevTotalExpenses,
        overdueOrders: overdueCount[0]?.count || 0,
        pendingQuotes: pendingQuotesCount[0]?.count || 0,
        activeOrders: activeOrdersCount[0]?.count || 0,
      },
      monthlyTrends: trends,
      topClients: topClients.map((c) => ({
        clientId: c.clientId,
        clientName: c.clientName || "Sin nombre",
        revenue: Number(c.revenue),
        orderCount: c.orderCount,
      })),
      topServices: topServices.map((s) => ({
        serviceType: s.serviceType,
        displayName: s.displayName || s.serviceType,
        revenue: Number(s.revenue),
        orderCount: s.orderCount,
      })),
    })
  } catch (error) {
    logApiError("/api/dashboard", "GET", error)
    return NextResponse.json(
      { error: "Error al obtener datos del dashboard" },
      { status: 500 }
    )
  }
}
