"use client"

import { MoreVertical, Trash2, MessageCircle, Send, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useOrders, useUpdateOrder, useDeleteOrder, useDuplicateOrder, type OrderWithClient } from "@/hooks/use-orders"
import { useUIStore } from "@/stores/ui-store"
import { formatDate, formatRelative, isOverdue } from "@/lib/utils/dates"
import { getWhatsAppLink, getInstagramLink, messageTemplates } from "@/lib/utils/messaging"
import {
  serviceTypeLabels,
  orderStatusLabels,
  orderStatuses,
} from "@/lib/validations/orders"
import type { OrderStatus } from "@/lib/db/schema"

const statusVariants: Record<OrderStatus, "pending" | "info" | "warning" | "success" | "secondary" | "destructive"> = {
  pending_quote: "pending",
  quoted: "info",
  approved: "info",
  in_progress: "warning",
  ready: "success",
  delivered: "secondary",
  cancelled: "destructive",
}

function OrderCard({ order }: { order: OrderWithClient }) {
  const updateOrder = useUpdateOrder()
  const deleteOrder = useDeleteOrder()
  const duplicateOrder = useDuplicateOrder()

  const handleStatusChange = async (newStatus: string) => {
    await updateOrder.mutateAsync({
      id: order.id,
      data: { status: newStatus as OrderStatus },
    })
  }

  const handleDelete = async () => {
    if (confirm("Eliminar este pedido?")) {
      await deleteOrder.mutateAsync(order.id)
    }
  }

  const handleDuplicate = async () => {
    await duplicateOrder.mutateAsync(order.id)
  }

  const overdue = isOverdue(order.dueDate)
  const clientName = order.client?.name?.split(" ")[0] || "cliente"
  const hasPhone = !!order.client?.phone
  const hasInstagram = !!order.client?.instagramHandle

  // Get appropriate message based on status
  const getQuickMessage = () => {
    switch (order.status) {
      case "pending_quote":
      case "quoted":
        return order.price
          ? messageTemplates.quote(clientName, order.serviceType, Number(order.price).toLocaleString("es-AR"))
          : messageTemplates.thanks(clientName)
      case "in_progress":
        return messageTemplates.inProgress(clientName, order.serviceType)
      case "ready":
        return messageTemplates.orderReady(clientName, order.serviceType)
      default:
        return messageTemplates.thanks(clientName)
    }
  }

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Client name */}
          <h3 className="font-medium">
            {order.client?.name || "Cliente desconocido"}
          </h3>

          {/* Service type and status */}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {serviceTypeLabels[order.serviceType]}
            </Badge>
            <Badge variant={statusVariants[order.status]}>
              {orderStatusLabels[order.status]}
            </Badge>
            {overdue && order.status !== "delivered" && order.status !== "cancelled" && (
              <Badge variant="destructive">Vencido</Badge>
            )}
          </div>

          {/* Description */}
          {order.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {order.description}
            </p>
          )}

          {/* Price and due date */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {order.price && (
              <span className="font-medium">
                ${Number(order.price).toLocaleString("es-AR")}
              </span>
            )}
            {order.dueDate && (
              <span className={overdue && order.status !== "delivered" ? "text-destructive" : "text-muted-foreground"}>
                Entrega: {formatDate(order.dueDate)}
              </span>
            )}
          </div>

          {/* Quick message buttons */}
          <div className="mt-3 flex flex-wrap gap-2">
            {hasPhone && (
              <a
                href={getWhatsAppLink(order.client!.phone!, getQuickMessage())}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            )}
            {hasInstagram && (
              <a
                href={getInstagramLink(order.client!.instagramHandle!)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 text-xs font-medium text-white hover:from-purple-600 hover:to-pink-600 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                Instagram
              </a>
            )}
            {hasPhone && (
              <a
                href={`tel:${order.client!.phone}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/80 transition-colors"
              >
                Llamar
              </a>
            )}
          </div>

          {/* Created at */}
          <p className="mt-2 text-xs text-muted-foreground">
            {formatRelative(order.createdAt)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2">
          <Select value={order.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {orderStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {orderStatusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hasPhone && (
                <>
                  <DropdownMenuItem asChild>
                    <a
                      href={getWhatsAppLink(order.client!.phone!, messageTemplates.orderReady(clientName, order.serviceType))}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Avisar "Listo"
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href={getWhatsAppLink(order.client!.phone!, messageTemplates.reminder(clientName))}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Recordatorio
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

export function OrderList() {
  const { statusFilter, serviceFilter, quickFilter } = useUIStore()

  const { data: orders = [], isLoading, error } = useOrders({
    status: statusFilter !== "all" ? statusFilter : undefined,
    serviceType: serviceFilter !== "all" ? serviceFilter : undefined,
  })

  // Apply quick filters client-side
  const filteredOrders = orders.filter((order) => {
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

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg border bg-muted"
          />
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

  if (filteredOrders.length === 0) {
    const hasFilters = statusFilter !== "all" || serviceFilter !== "all" || quickFilter !== null

    return (
      <div className="rounded-lg border bg-background p-6 lg:p-8 text-center text-muted-foreground">
        <p className="text-base lg:text-lg font-medium">
          {hasFilters ? "No hay pedidos con estos filtros" : "No hay pedidos"}
        </p>
        <p className="text-sm mt-1">
          {hasFilters ? "Prueba con otros filtros" : "Crea tu primer pedido para comenzar"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {filteredOrders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}
