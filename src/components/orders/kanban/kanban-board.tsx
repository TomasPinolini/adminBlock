"use client"

import { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { useOrders, useUpdateOrder, type OrderWithClient } from "@/hooks/use-orders"
import { useUIStore } from "@/stores/ui-store"
import { orderStatuses } from "@/lib/validations/orders"
import { KanbanColumn } from "./kanban-column"
import { KanbanCardGhost } from "./kanban-card"
import type { OrderStatus } from "@/lib/db/schema"

const PaymentModal = dynamic(() => import("../payment-modal").then(m => ({ default: m.PaymentModal })), { ssr: false })
const EditOrderModal = dynamic(() => import("../edit-order-modal").then(m => ({ default: m.EditOrderModal })), { ssr: false })
const ActivityModal = dynamic(() => import("../activity-modal").then(m => ({ default: m.ActivityModal })), { ssr: false })
const ComprobantesModal = dynamic(() => import("../comprobantes-modal").then(m => ({ default: m.ComprobantesModal })), { ssr: false })
const EmailComposeModal = dynamic(() => import("@/components/email-compose-modal").then(m => ({ default: m.EmailComposeModal })), { ssr: false })

interface KanbanBoardProps {
  searchQuery?: string
}

export function KanbanBoard({ searchQuery = "" }: KanbanBoardProps) {
  const { statusFilter, serviceFilter, quickFilter, showArchived } = useUIStore()
  const focusOrderId = useUIStore((s) => s.focusOrderId)
  const setFocusOrderId = useUIStore((s) => s.setFocusOrderId)
  const queryClient = useQueryClient()

  // Modals
  const [editingOrder, setEditingOrder] = useState<OrderWithClient | null>(null)
  const [paymentOrder, setPaymentOrder] = useState<OrderWithClient | null>(null)
  const [historyOrder, setHistoryOrder] = useState<OrderWithClient | null>(null)
  const [emailOrder, setEmailOrder] = useState<OrderWithClient | null>(null)
  const [comprobantesOrder, setComprobantesOrder] = useState<OrderWithClient | null>(null)

  // Drag state
  const [activeOrder, setActiveOrder] = useState<OrderWithClient | null>(null)

  const updateOrder = useUpdateOrder()

  const { data: orders = [], isLoading, error } = useOrders({
    status: statusFilter !== "all" ? statusFilter : undefined,
    serviceType: serviceFilter !== "all" ? serviceFilter : undefined,
    includeArchived: showArchived,
  })

  // Client-side filters (same logic as order-list.tsx)
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const clientName = order.client?.name?.toLowerCase() || ""
        const description = order.description?.toLowerCase() || ""
        if (!clientName.includes(query) && !description.includes(query)) {
          return false
        }
      }

      if (!quickFilter) return true

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split("T")[0]

      if (quickFilter === "overdue") {
        if (!order.dueDate) return false
        if (order.status === "delivered" || order.status === "cancelled") return false
        return new Date(order.dueDate) < today
      }

      if (quickFilter === "due_today") {
        if (!order.dueDate) return false
        if (order.status === "delivered" || order.status === "cancelled") return false
        return order.dueDate === todayStr
      }

      return true
    })
  }, [orders, searchQuery, quickFilter])

  // Group orders by status
  const columns = useMemo(() => {
    const grouped: Record<OrderStatus, OrderWithClient[]> = {
      pending_quote: [],
      quoted: [],
      approved: [],
      in_progress: [],
      ready: [],
      delivered: [],
      cancelled: [],
    }
    for (const order of filteredOrders) {
      grouped[order.status as OrderStatus]?.push(order)
    }
    return grouped
  }, [filteredOrders])

  // Focus order from search/command palette
  useEffect(() => {
    if (focusOrderId && orders.length > 0) {
      const order = orders.find((o) => o.id === focusOrderId)
      if (order) {
        setEditingOrder(order)
        setFocusOrderId(null)
      }
    }
  }, [focusOrderId, orders, setFocusOrderId])

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const order = event.active.data.current?.order as OrderWithClient | undefined
    setActiveOrder(order ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveOrder(null)

    const { active, over } = event
    if (!over) return

    const orderId = active.id as string
    const newStatus = over.id as OrderStatus

    // Find the order
    const order = filteredOrders.find((o) => o.id === orderId)
    if (!order || order.status === newStatus) return

    // Optimistic update
    queryClient.setQueriesData<OrderWithClient[]>(
      { queryKey: ["orders"] },
      (old) =>
        old?.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        )
    )

    updateOrder.mutate(
      { id: orderId, data: { status: newStatus } },
      {
        onSuccess: () => {
          toast.success("Estado actualizado")
          queryClient.invalidateQueries({ queryKey: ["orders"] })
          queryClient.invalidateQueries({ queryKey: ["stats"] })
        },
        onError: () => {
          toast.error("Error al cambiar estado")
          queryClient.invalidateQueries({ queryKey: ["orders"] })
        },
      }
    )
  }

  // Which columns to show
  const visibleStatuses =
    statusFilter !== "all"
      ? [statusFilter as OrderStatus]
      : ([...orderStatuses] as OrderStatus[])

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="w-64 min-w-[256px] shrink-0 rounded-lg border bg-muted/40 animate-pulse"
          >
            <div className="h-9 rounded-t-lg bg-muted" />
            <div className="p-2 space-y-2">
              <div className="h-20 rounded-md bg-muted" />
              <div className="h-20 rounded-md bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-background p-6 text-center">
        <p className="text-destructive">Error al cargar pedidos</p>
      </div>
    )
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className={
            statusFilter !== "all"
              ? "flex justify-center pb-2"
              : "flex gap-3 overflow-x-auto pb-2"
          }
        >
          {visibleStatuses.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              orders={columns[status] || []}
              onCardClick={setEditingOrder}
            />
          ))}
        </div>

        <DragOverlay>
          {activeOrder ? <KanbanCardGhost order={activeOrder} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Modals — same pattern as order-list.tsx */}
      <PaymentModal
        order={paymentOrder}
        open={!!paymentOrder}
        onClose={() => setPaymentOrder(null)}
      />

      <EditOrderModal
        order={editingOrder}
        open={!!editingOrder}
        onOpenChange={(open) => !open && setEditingOrder(null)}
      />

      <ActivityModal
        orderId={historyOrder?.id ?? null}
        orderLabel={historyOrder?.client?.name}
        open={!!historyOrder}
        onOpenChange={(open) => !open && setHistoryOrder(null)}
      />

      {emailOrder?.client?.email && (
        <EmailComposeModal
          open={!!emailOrder}
          onClose={() => setEmailOrder(null)}
          to={emailOrder.client.email}
          clientName={emailOrder.client.name || "Cliente"}
          defaultSubject=""
          defaultBody=""
        />
      )}

      <ComprobantesModal
        orderId={comprobantesOrder?.id ?? null}
        orderLabel={comprobantesOrder?.client?.name}
        open={!!comprobantesOrder}
        onOpenChange={(open) => !open && setComprobantesOrder(null)}
      />
    </>
  )
}
