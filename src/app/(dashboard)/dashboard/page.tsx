"use client"

import { useDashboard } from "@/hooks/use-dashboard"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { RevenueExpenseChart } from "@/components/dashboard/revenue-expense-chart"
import { OrdersChart } from "@/components/dashboard/orders-chart"
import { TopClientsList } from "@/components/dashboard/top-clients-list"
import { TopServicesList } from "@/components/dashboard/top-services-list"

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard()

  if (isLoading) return <DashboardSkeleton />

  if (error || !data) {
    return (
      <div className="rounded-lg border bg-background p-6 text-center">
        <p className="text-destructive">Error al cargar el dashboard</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen general de tu negocio
        </p>
      </div>

      <KPICards kpis={data.kpis} />

      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueExpenseChart data={data.monthlyTrends} />
        <OrdersChart data={data.monthlyTrends} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TopClientsList data={data.topClients} />
        <TopServicesList data={data.topServices} />
      </div>
    </div>
  )
}
