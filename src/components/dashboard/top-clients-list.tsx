"use client"

import type { TopClient } from "@/hooks/use-dashboard"
import { formatCurrency } from "@/lib/utils/invoice"

interface TopClientsListProps {
  data: TopClient[]
}

export function TopClientsList({ data }: TopClientsListProps) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <h3 className="text-sm font-semibold mb-3">Top clientes del mes</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Sin datos este mes
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((client, i) => (
            <div key={client.clientId} className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{client.clientName}</p>
                <p className="text-xs text-muted-foreground">
                  {client.orderCount} {client.orderCount === 1 ? "pedido" : "pedidos"}
                </p>
              </div>
              <span className="text-sm font-semibold text-green-600 whitespace-nowrap">
                {formatCurrency(client.revenue)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
