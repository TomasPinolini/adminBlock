"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { MonthlyTrend } from "@/hooks/use-dashboard"

interface OrdersChartProps {
  data: MonthlyTrend[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm" style={{ color: "#3b82f6" }}>
        Pedidos: {payload[0].value}
      </p>
    </div>
  )
}

export function OrdersChart({ data }: OrdersChartProps) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <h3 className="text-sm font-semibold mb-3">Pedidos por mes</h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="orderCount"
            name="Pedidos"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
