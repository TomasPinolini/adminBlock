"use client"

import {
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  CalendarClock,
  Package
} from "lucide-react"
import { useStats } from "@/hooks/use-stats"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  variant?: "default" | "warning" | "success" | "info"
  onClick?: () => void
}

function StatCard({ label, value, icon, variant = "default", onClick }: StatCardProps) {
  const variantStyles = {
    default: "bg-background border",
    warning: "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800",
    success: "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
    info: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
  }

  const iconStyles = {
    default: "text-muted-foreground",
    warning: "text-orange-600 dark:text-orange-400",
    success: "text-green-600 dark:text-green-400",
    info: "text-blue-600 dark:text-blue-400",
  }

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg p-3 text-left transition-colors",
        variantStyles[variant],
        onClick && "hover:bg-muted/50 cursor-pointer"
      )}
    >
      <div className={cn("rounded-full p-2 bg-background/50", iconStyles[variant])}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </div>
    </button>
  )
}

interface DashboardStatsProps {
  onFilterChange?: (filter: string) => void
}

export function DashboardStats({ onFilterChange }: DashboardStatsProps) {
  const { data: stats, isLoading } = useStats()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (!stats) return null

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Pedidos hoy"
          value={stats.todayOrders}
          icon={<ClipboardList className="h-5 w-5" />}
          variant="info"
        />
        <StatCard
          label="Por cotizar"
          value={stats.pendingQuotes}
          icon={<Clock className="h-5 w-5" />}
          variant={stats.pendingQuotes > 0 ? "warning" : "default"}
          onClick={() => onFilterChange?.("pending_quote")}
        />
        <StatCard
          label="Listos p/ retirar"
          value={stats.readyForPickup}
          icon={<CheckCircle className="h-5 w-5" />}
          variant={stats.readyForPickup > 0 ? "success" : "default"}
          onClick={() => onFilterChange?.("ready")}
        />
        <StatCard
          label="Vencidos"
          value={stats.overdue}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant={stats.overdue > 0 ? "warning" : "default"}
          onClick={() => onFilterChange?.("overdue")}
        />
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
          <DollarSign className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-lg font-bold">{formatCurrency(stats.weekRevenue)}</p>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
          <DollarSign className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-lg font-bold">{formatCurrency(stats.monthRevenue)}</p>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </div>
        </div>
      </div>
    </div>
  )
}
