"use client"

import { AlertTriangle, CalendarClock, Package, Clock, CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUIStore, QuickFilter } from "@/stores/ui-store"
import { useStats } from "@/hooks/use-stats"
import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/lib/db/schema"

interface FilterButtonProps {
  label: string
  count?: number
  icon: React.ReactNode
  active: boolean
  variant?: "default" | "warning" | "success"
  onClick: () => void
}

function FilterButton({ label, count, icon, active, variant = "default", onClick }: FilterButtonProps) {
  const variantStyles = {
    default: active ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
    warning: active
      ? "bg-orange-500 text-white"
      : "bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/30 dark:text-orange-400",
    success: active
      ? "bg-green-500 text-white"
      : "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400",
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 min-h-[44px] text-xs font-medium transition-colors border",
        variantStyles[variant],
        active && "border-transparent"
      )}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={cn(
          "ml-1 rounded-full px-1.5 py-0.5 text-xs",
          active ? "bg-white/20" : "bg-muted"
        )}>
          {count}
        </span>
      )}
    </button>
  )
}

export function QuickFilters() {
  const { data: stats } = useStats()
  const {
    statusFilter,
    quickFilter,
    setStatusFilter,
    setQuickFilter,
    resetFilters,
  } = useUIStore()

  const hasActiveFilter = statusFilter !== "all" || quickFilter !== null

  const handleStatusFilter = (status: OrderStatus) => {
    if (statusFilter === status) {
      resetFilters()
    } else {
      setStatusFilter(status)
    }
  }

  const handleQuickFilter = (filter: QuickFilter) => {
    if (quickFilter === filter) {
      resetFilters()
    } else {
      setQuickFilter(filter)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground mr-1">Filtros:</span>

      <FilterButton
        label="Vencidos"
        count={stats?.overdue}
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        active={quickFilter === "overdue"}
        variant={stats?.overdue && stats.overdue > 0 ? "warning" : "default"}
        onClick={() => handleQuickFilter("overdue")}
      />

      <FilterButton
        label="Hoy"
        count={stats?.dueToday}
        icon={<CalendarClock className="h-3.5 w-3.5" />}
        active={quickFilter === "due_today"}
        onClick={() => handleQuickFilter("due_today")}
      />

      <FilterButton
        label="Por cotizar"
        count={stats?.pendingQuotes}
        icon={<Clock className="h-3.5 w-3.5" />}
        active={statusFilter === "pending_quote"}
        onClick={() => handleStatusFilter("pending_quote")}
      />

      <FilterButton
        label="En proceso"
        count={stats?.inProgress}
        icon={<Package className="h-3.5 w-3.5" />}
        active={statusFilter === "in_progress"}
        onClick={() => handleStatusFilter("in_progress")}
      />

      <FilterButton
        label="Listos"
        count={stats?.readyForPickup}
        icon={<CheckCircle className="h-3.5 w-3.5" />}
        active={statusFilter === "ready"}
        variant={stats?.readyForPickup && stats.readyForPickup > 0 ? "success" : "default"}
        onClick={() => handleStatusFilter("ready")}
      />

      {hasActiveFilter && (
        <button
          onClick={resetFilters}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3 w-3" />
          Limpiar
        </button>
      )}
    </div>
  )
}
