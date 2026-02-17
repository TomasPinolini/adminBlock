"use client"

import { useMemo } from "react"
import dayjs from "dayjs"
import { cn } from "@/lib/utils"
import type { OrderWithClient } from "@/hooks/use-orders"
import type { OrderStatus } from "@/lib/db/schema"
import { orderStatusLabels } from "@/lib/validations/orders"

const statusColors: Record<OrderStatus, string> = {
  pending_quote: "border-blue-500",
  quoted: "border-blue-500",
  approved: "border-blue-500",
  in_progress: "border-yellow-500",
  ready: "border-green-500",
  delivered: "border-gray-400",
  cancelled: "border-gray-400",
}

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

interface CalendarWeekViewProps {
  weekStart: string
  ordersByDate: Record<string, OrderWithClient[]>
  onOrderClick: (order: OrderWithClient) => void
}

export function CalendarWeekView({ weekStart, ordersByDate, onOrderClick }: CalendarWeekViewProps) {
  const weekDays = useMemo(() => {
    const start = dayjs(weekStart)
    return Array.from({ length: 7 }, (_, i) => {
      const date = start.add(i, "day")
      return {
        date: date.format("YYYY-MM-DD"),
        dayName: DAY_NAMES[i],
        dayNum: date.date(),
        monthName: date.format("MMM"),
        isToday: date.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD"),
      }
    })
  }, [weekStart])

  return (
    <div className="space-y-2">
      {weekDays.map((day) => {
        const dayOrders = ordersByDate[day.date] || []
        return (
          <div key={day.date} className={cn(
            "rounded-lg border bg-background p-3",
            day.isToday && "border-primary"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                "text-sm font-medium",
                day.isToday && "text-primary"
              )}>
                {day.dayName} {day.dayNum} {day.monthName}
              </span>
              {dayOrders.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({dayOrders.length} {dayOrders.length === 1 ? "pedido" : "pedidos"})
                </span>
              )}
            </div>

            {dayOrders.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin entregas</p>
            ) : (
              <div className="space-y-1.5">
                {dayOrders.map((order) => {
                  const isOverdue = order.dueDate && new Date(order.dueDate) < new Date(new Date().toDateString())
                  return (
                    <button
                      key={order.id}
                      onClick={() => onOrderClick(order)}
                      className={cn(
                        "flex items-center justify-between w-full text-left rounded border-l-4 bg-muted/30 px-3 py-2 hover:bg-muted/50 transition-colors",
                        isOverdue ? "border-red-500" : statusColors[order.status]
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium truncate block">
                          {order.client?.name || "Sin cliente"}
                        </span>
                        <span className="text-xs text-muted-foreground truncate block">
                          {order.serviceType}{order.description ? ` — ${order.description}` : ""}
                        </span>
                      </div>
                      <span className={cn(
                        "text-xs font-medium ml-2 shrink-0",
                        isOverdue ? "text-red-600" : "text-muted-foreground"
                      )}>
                        {isOverdue ? "Vencido" : orderStatusLabels[order.status]}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
