"use client"

import {
  DollarSign,
  ClipboardList,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  FileQuestion,
} from "lucide-react"
import type { DashboardKPIs } from "@/hooks/use-dashboard"
import { formatCurrency } from "@/lib/utils/invoice"
import { cn } from "@/lib/utils"

function ChangeIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null
  if (previous === 0) return <span className="text-xs text-green-600">Nuevo</span>

  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return <span className="text-xs text-muted-foreground">= vs mes ant.</span>

  const isPositive = pct > 0
  return (
    <span className={cn("text-xs font-medium", isPositive ? "text-green-600" : "text-red-600")}>
      {isPositive ? "+" : ""}{pct}% vs mes ant.
    </span>
  )
}

interface KPICardsProps {
  kpis: DashboardKPIs
}

export function KPICards({ kpis }: KPICardsProps) {
  const balance = kpis.monthRevenue - kpis.monthExpenses

  const cards = [
    {
      label: "Ventas del mes",
      value: formatCurrency(kpis.monthRevenue),
      icon: TrendingUp,
      iconColor: "text-green-600",
      comparison: <ChangeIndicator current={kpis.monthRevenue} previous={kpis.prevMonthRevenue} />,
    },
    {
      label: "Pedidos del mes",
      value: kpis.monthOrders.toString(),
      icon: ClipboardList,
      iconColor: "text-blue-600",
      comparison: <ChangeIndicator current={kpis.monthOrders} previous={kpis.prevMonthOrders} />,
    },
    {
      label: "Gastos del mes",
      value: formatCurrency(kpis.monthExpenses),
      icon: TrendingDown,
      iconColor: "text-red-600",
      comparison: <ChangeIndicator current={kpis.monthExpenses} previous={kpis.prevMonthExpenses} />,
    },
    {
      label: "Balance",
      value: formatCurrency(balance),
      icon: DollarSign,
      iconColor: balance >= 0 ? "text-green-600" : "text-red-600",
      valueColor: balance >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      label: "Vencidos",
      value: kpis.overdueOrders.toString(),
      icon: AlertTriangle,
      iconColor: kpis.overdueOrders > 0 ? "text-red-600" : "text-muted-foreground",
      valueColor: kpis.overdueOrders > 0 ? "text-red-600" : undefined,
    },
    {
      label: "Por cotizar",
      value: kpis.pendingQuotes.toString(),
      icon: FileQuestion,
      iconColor: kpis.pendingQuotes > 0 ? "text-orange-600" : "text-muted-foreground",
      valueColor: kpis.pendingQuotes > 0 ? "text-orange-600" : undefined,
    },
  ]

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border bg-background p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <card.icon className={cn("h-4 w-4", card.iconColor)} />
            {card.label}
          </div>
          <p className={cn("mt-1 text-lg font-bold", card.valueColor)}>
            {card.value}
          </p>
          {card.comparison && (
            <div className="mt-0.5">{card.comparison}</div>
          )}
        </div>
      ))}
    </div>
  )
}
