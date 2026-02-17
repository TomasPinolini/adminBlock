"use client"

import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { orderStatusLabels } from "@/lib/validations/orders"
import { KanbanCard } from "./kanban-card"
import type { OrderWithClient } from "@/hooks/use-orders"
import type { OrderStatus } from "@/lib/db/schema"

const columnColors: Record<OrderStatus, { header: string; ring: string }> = {
  pending_quote: {
    header: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    ring: "ring-gray-300 dark:ring-gray-600",
  },
  quoted: {
    header: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    ring: "ring-blue-300 dark:ring-blue-600",
  },
  approved: {
    header: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    ring: "ring-blue-300 dark:ring-blue-600",
  },
  in_progress: {
    header: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
    ring: "ring-orange-300 dark:ring-orange-600",
  },
  ready: {
    header: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    ring: "ring-green-300 dark:ring-green-600",
  },
  delivered: {
    header: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
    ring: "ring-gray-300 dark:ring-gray-600",
  },
  cancelled: {
    header: "bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400",
    ring: "ring-red-300 dark:ring-red-600",
  },
}

interface KanbanColumnProps {
  status: OrderStatus
  orders: OrderWithClient[]
  onCardClick: (order: OrderWithClient) => void
}

export function KanbanColumn({ status, orders, onCardClick }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: status })
  const colors = columnColors[status]
  const isMuted = status === "delivered" || status === "cancelled"

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-64 min-w-[256px] shrink-0 flex-col rounded-lg border bg-muted/40 transition-all",
        isOver && `ring-2 ${colors.ring} bg-muted/70`,
        isMuted && "opacity-70"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between rounded-t-lg px-3 py-2",
          colors.header
        )}
      >
        <span className="text-xs font-semibold truncate">
          {orderStatusLabels[status]}
        </span>
        <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-background/60 px-1.5 text-[10px] font-bold">
          {orders.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2 max-h-[calc(100vh-280px)]">
        {orders.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Sin pedidos
          </p>
        ) : (
          orders.map((order) => (
            <KanbanCard key={order.id} order={order} onClick={onCardClick} />
          ))
        )}
      </div>
    </div>
  )
}
