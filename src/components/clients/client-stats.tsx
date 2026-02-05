"use client"

import { Users, UserPlus, Crown, DollarSign } from "lucide-react"
import { useClientStats } from "@/hooks/use-clients"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  variant?: "default" | "success" | "info"
  subtext?: string
}

function StatCard({ label, value, icon, variant = "default", subtext }: StatCardProps) {
  const variantStyles = {
    default: "bg-background border",
    success: "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
    info: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
  }

  const iconStyles = {
    default: "text-muted-foreground",
    success: "text-green-600 dark:text-green-400",
    info: "text-blue-600 dark:text-blue-400",
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg p-3",
        variantStyles[variant]
      )}
    >
      <div className={cn("rounded-full p-2 bg-background/50", iconStyles[variant])}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        {subtext && (
          <p className="text-xs text-muted-foreground/70 truncate">{subtext}</p>
        )}
      </div>
    </div>
  )
}

export function ClientStats() {
  const { data: stats, isLoading } = useClientStats()

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Total clientes"
        value={stats.totalClients}
        icon={<Users className="h-5 w-5" />}
        variant="info"
      />
      <StatCard
        label="Nuevos este mes"
        value={stats.newThisMonth}
        icon={<UserPlus className="h-5 w-5" />}
        variant={stats.newThisMonth > 0 ? "success" : "default"}
      />
      <StatCard
        label="Mejor cliente"
        value={stats.topClient ? stats.topClient.name.split(" ")[0] : "-"}
        icon={<Crown className="h-5 w-5" />}
        variant="default"
        subtext={stats.topClient ? formatCurrency(Number(stats.topClient.totalSpent)) : undefined}
      />
      <StatCard
        label="Ingresos totales"
        value={formatCurrency(stats.totalRevenue)}
        icon={<DollarSign className="h-5 w-5" />}
        variant="success"
      />
    </div>
  )
}
