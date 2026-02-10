"use client"

import type { TopService } from "@/hooks/use-dashboard"
import { formatCurrency } from "@/lib/utils/invoice"

interface TopServicesListProps {
  data: TopService[]
}

export function TopServicesList({ data }: TopServicesListProps) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <h3 className="text-sm font-semibold mb-3">Top servicios del mes</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Sin datos este mes
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((service, i) => (
            <div key={service.serviceType} className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{service.displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {service.orderCount} {service.orderCount === 1 ? "pedido" : "pedidos"}
                </p>
              </div>
              <span className="text-sm font-semibold text-blue-600 whitespace-nowrap">
                {formatCurrency(service.revenue)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
