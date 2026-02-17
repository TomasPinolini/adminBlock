"use client"

import { useDraggable } from "@dnd-kit/core"
import { Badge } from "@/components/ui/badge"
import { useServices } from "@/hooks/use-services"
import { formatDate, isOverdue } from "@/lib/utils/dates"
import { cn } from "@/lib/utils"
import type { OrderWithClient } from "@/hooks/use-orders"
import type { PaymentStatus } from "@/lib/db/schema"

const paymentDotColors: Record<PaymentStatus, string> = {
  pending: "bg-muted-foreground",
  partial: "bg-orange-500",
  paid: "bg-green-500",
}

interface KanbanCardProps {
  order: OrderWithClient
  onClick: (order: OrderWithClient) => void
}

export function KanbanCard({ order, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: order.id,
    data: { order },
  })
  const { data: services = [] } = useServices()

  const overdue =
    isOverdue(order.dueDate) &&
    order.status !== "delivered" &&
    order.status !== "cancelled"
  const paymentStatus = (order.paymentStatus || "pending") as PaymentStatus
  const hasPrice = !!order.price && Number(order.price) > 0

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onClick(order)}
      className={cn(
        "rounded-md border bg-background p-2.5 cursor-grab active:cursor-grabbing shadow-sm hover:shadow transition-shadow select-none",
        overdue && "border-l-2 border-l-destructive",
        isDragging && "opacity-50"
      )}
    >
      {/* Client name */}
      <p className="font-medium text-sm truncate">
        {order.client?.name || "Cliente desconocido"}
      </p>

      {/* Service + payment dot */}
      <div className="mt-1 flex items-center gap-1.5">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {services.find((s) => s.name === order.serviceType)?.displayName ||
            order.serviceType}
        </Badge>
        {hasPrice && (
          <span
            className={cn(
              "h-2 w-2 rounded-full shrink-0",
              paymentDotColors[paymentStatus]
            )}
            title={
              paymentStatus === "paid"
                ? "Pagado"
                : paymentStatus === "partial"
                  ? "Pago parcial"
                  : "Sin pagar"
            }
          />
        )}
      </div>

      {/* Price + due date */}
      <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
        {order.price ? (
          <span className="font-medium text-foreground">
            ${Number(order.price).toLocaleString("es-AR")}
          </span>
        ) : (
          <span />
        )}
        {order.dueDate && (
          <span className={overdue ? "text-destructive font-medium" : ""}>
            {formatDate(order.dueDate)}
          </span>
        )}
      </div>
    </div>
  )
}

/** Ghost card shown in DragOverlay */
export function KanbanCardGhost({ order }: { order: OrderWithClient }) {
  const { data: services = [] } = useServices()

  return (
    <div className="w-64 rounded-md border bg-background p-2.5 shadow-lg opacity-90 rotate-2">
      <p className="font-medium text-sm truncate">
        {order.client?.name || "Cliente desconocido"}
      </p>
      <div className="mt-1 flex items-center gap-1.5">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {services.find((s) => s.name === order.serviceType)?.displayName ||
            order.serviceType}
        </Badge>
      </div>
      {order.price && (
        <p className="mt-1.5 text-xs font-medium">
          ${Number(order.price).toLocaleString("es-AR")}
        </p>
      )}
    </div>
  )
}
