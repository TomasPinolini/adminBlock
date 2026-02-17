"use client"

import { cn } from "@/lib/utils"
import type { OrderWithClient } from "@/hooks/use-orders"
import type { OrderStatus } from "@/lib/db/schema"

const statusColors: Record<OrderStatus, string> = {
  pending_quote: "bg-blue-500",
  quoted: "bg-blue-500",
  approved: "bg-blue-500",
  in_progress: "bg-yellow-500",
  ready: "bg-green-500",
  delivered: "bg-gray-400",
  cancelled: "bg-gray-400",
}

interface CalendarOrderPillProps {
  order: OrderWithClient
  onClick: (order: OrderWithClient) => void
  compact?: boolean
}

export function CalendarOrderPill({ order, onClick, compact }: CalendarOrderPillProps) {
  const isOverdue = order.dueDate && new Date(order.dueDate) < new Date(new Date().toDateString())

  if (compact) {
    return (
      <button
        onClick={() => onClick(order)}
        className={cn(
          "h-2 w-2 rounded-full shrink-0",
          isOverdue ? "bg-red-500" : statusColors[order.status]
        )}
        title={`${order.client?.name || "Sin cliente"} - ${order.serviceType}`}
      />
    )
  }

  return (
    <button
      onClick={() => onClick(order)}
      className={cn(
        "flex items-center gap-1.5 w-full text-left px-1.5 py-0.5 rounded text-xs truncate hover:bg-muted/50 transition-colors",
        isOverdue && "text-red-600"
      )}
    >
      <span className={cn(
        "h-2 w-2 rounded-full shrink-0",
        isOverdue ? "bg-red-500" : statusColors[order.status]
      )} />
      <span className="truncate">{order.client?.name || "Sin cliente"}</span>
    </button>
  )
}
