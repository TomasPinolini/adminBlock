"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { MoreVertical, Trash2, MessageCircle, Mail, Send, Copy, Receipt, CheckCircle, Clock, Archive, ArchiveRestore, Edit, Phone, History } from "lucide-react"
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
import { useOrders, useUpdateOrder, useDeleteOrder, useDuplicateOrder, useArchiveOrder, useUnarchiveOrder, type OrderWithClient } from "@/hooks/use-orders"
import { useUIStore } from "@/stores/ui-store"
import { formatDate, formatRelative, isOverdue } from "@/lib/utils/dates"
import { getWhatsAppLink, messageTemplates } from "@/lib/utils/messaging"
import { sendEmail, emailTemplates } from "@/lib/utils/email"
import {
  orderStatusLabels,
  orderStatuses,
} from "@/lib/validations/orders"
import { useServices } from "@/hooks/use-services"
import type { OrderStatus, PaymentStatus, Service } from "@/lib/db/schema"
import { PaymentModal } from "./payment-modal"
import { EditOrderModal } from "./edit-order-modal"
import { ActivityModal } from "./activity-modal"
import { cn } from "@/lib/utils"

const statusVariants: Record<OrderStatus, "pending" | "info" | "warning" | "success" | "secondary" | "destructive"> = {
  pending_quote: "pending",
  quoted: "info",
  approved: "info",
  in_progress: "warning",
  ready: "success",
  delivered: "secondary",
  cancelled: "destructive",
}

const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "Sin pagar",
  partial: "Pago parcial",
  paid: "Pagado",
}

const paymentStatusVariants: Record<PaymentStatus, "destructive" | "warning" | "success"> = {
  pending: "destructive",
  partial: "warning",
  paid: "success",
}

interface OrderCardProps {
  order: OrderWithClient
  onPayment: (order: OrderWithClient) => void
  onEdit: (order: OrderWithClient) => void
  onHistory: (order: OrderWithClient) => void
}

function OrderCard({ order, onPayment, onEdit, onHistory }: OrderCardProps) {
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const { data: services = [] } = useServices()
  const updateOrder = useUpdateOrder()
  const deleteOrder = useDeleteOrder()
  const duplicateOrder = useDuplicateOrder()
  const archiveOrder = useArchiveOrder()
  const unarchiveOrder = useUnarchiveOrder()

  const handleStatusChange = async (newStatus: string) => {
    await updateOrder.mutateAsync({
      id: order.id,
      data: { status: newStatus as OrderStatus },
    })
  }

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Eliminar pedido",
      description: `¿Estás seguro de que deseas eliminar el pedido de ${order.client?.name}? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      variant: "destructive",
    })
    if (confirmed) {
      await deleteOrder.mutateAsync(order.id)
      toast.success("Pedido eliminado")
    }
  }

  const handleDuplicate = async () => {
    await duplicateOrder.mutateAsync(order.id)
  }

  const handleArchive = async () => {
    await archiveOrder.mutateAsync(order.id)
  }

  const handleUnarchive = async () => {
    await unarchiveOrder.mutateAsync(order.id)
  }

  const isArchived = order.isArchived
  const canArchive = order.status === "delivered" && order.paymentStatus === "paid"

  const overdue = isOverdue(order.dueDate)
  const clientName = order.client?.name?.split(" ")[0] || "cliente"
  const hasPhone = !!order.client?.phone
  const hasEmail = !!order.client?.email
  const hasPrice = !!order.price && Number(order.price) > 0
  const paymentStatus = (order.paymentStatus || "pending") as PaymentStatus

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

  const getEmailTemplate = () => {
    switch (order.status) {
      case "quoted":
        return order.price
          ? emailTemplates.quote(clientName, order.serviceType, Number(order.price).toLocaleString("es-AR"))
          : emailTemplates.thanks(clientName)
      case "in_progress":
        return emailTemplates.inProgress(clientName, order.serviceType)
      case "ready":
        return emailTemplates.orderReady(clientName, order.serviceType)
      default:
        return emailTemplates.thanks(clientName)
    }
  }

  const handleSendEmail = async () => {
    if (!order.client?.email) return
    const template = getEmailTemplate()
    const result = await sendEmail({ to: order.client.email, ...template })
    if (result.success) {
      toast.success("Email enviado")
    } else {
      toast.error(result.error || "Error al enviar email")
    }
  }

  return (
    <div className="rounded-lg border bg-background p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          {/* Client name */}
          <h3 className="font-medium text-sm sm:text-base">
            {order.client?.name || "Cliente desconocido"}
          </h3>

          {/* Service type and status */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Badge variant="outline">
              {services.find((s) => s.name === order.serviceType)?.displayName || order.serviceType}
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
            <p className="mt-1.5 sm:mt-2 text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2">
              {order.description}
            </p>
          )}

          {/* Price and payment status */}
          <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-sm">
            {order.price && (
              <span className="font-medium">
                ${Number(order.price).toLocaleString("es-AR")}
              </span>
            )}
            {hasPrice && (
              <span className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                paymentStatus === "paid" && "text-green-600",
                paymentStatus === "partial" && "text-orange-600",
                paymentStatus === "pending" && "text-muted-foreground"
              )}>
                {paymentStatus === "paid" && <CheckCircle className="h-3 w-3" />}
                {paymentStatus === "partial" && <Clock className="h-3 w-3" />}
                {paymentStatusLabels[paymentStatus]}
                {paymentStatus === "partial" && order.paymentAmount && (
                  <span>(${Number(order.paymentAmount).toLocaleString("es-AR")})</span>
                )}
              </span>
            )}
            {order.dueDate && (
              <span className={overdue && order.status !== "delivered" ? "text-destructive" : "text-muted-foreground"}>
                Entrega: {formatDate(order.dueDate)}
              </span>
            )}
          </div>

          {/* Invoice information */}
          {(order.invoiceNumber || order.invoiceType !== "none" || order.quantity) && (
            <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {order.invoiceNumber && (
                <span className="inline-flex items-center gap-1">
                  <Receipt className="h-3 w-3" />
                  Factura {order.invoiceType !== "none" ? order.invoiceType : ""} N° {order.invoiceNumber}
                </span>
              )}
              {order.quantity && (
                <span>Cantidad: {order.quantity}</span>
              )}
              {order.subtotal && order.invoiceType === "A" && (
                <span>Subtotal: ${Number(order.subtotal).toLocaleString("es-AR")}</span>
              )}
              {order.taxAmount && order.invoiceType === "A" && (
                <span>IVA: ${Number(order.taxAmount).toLocaleString("es-AR")}</span>
              )}
            </div>
          )}

          {/* Quick message buttons */}
          <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
            {hasPhone && (
              <a
                href={getWhatsAppLink(order.client!.phone!, getQuickMessage())}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 sm:gap-1.5 rounded-md bg-green-600 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
            {hasEmail && (
              <button
                onClick={handleSendEmail}
                className="inline-flex items-center gap-1 sm:gap-1.5 rounded-md bg-blue-500 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-white hover:bg-blue-600 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Email</span>
              </button>
            )}
            {hasPrice && paymentStatus !== "paid" && (
              <button
                onClick={() => onPayment(order)}
                className="inline-flex items-center gap-1 sm:gap-1.5 rounded-md bg-blue-600 px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Receipt className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Registrar</span> Pago
              </button>
            )}
            {hasPhone && (
              <a
                href={`tel:${order.client!.phone}`}
                className="inline-flex items-center gap-1 sm:gap-1.5 rounded-md bg-muted px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium hover:bg-muted/80 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Llamar</span>
              </a>
            )}
          </div>

          {/* Receipt link if exists */}
          {order.receiptUrl && (
            <a
              href={order.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <Receipt className="h-3 w-3" />
              Ver comprobante
            </a>
          )}

          {/* Created at */}
          <p className="mt-1.5 sm:mt-2 text-xs text-muted-foreground">
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
              {hasPrice && (
                <>
                  <DropdownMenuItem onClick={() => onPayment(order)}>
                    <Receipt className="mr-2 h-4 w-4" />
                    {paymentStatus === "paid" ? "Ver pago" : "Registrar pago"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
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
              <DropdownMenuItem onClick={() => onEdit(order)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onHistory(order)}>
                <History className="mr-2 h-4 w-4" />
                Historial
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate} disabled={duplicateOrder.isPending}>
                <Copy className="mr-2 h-4 w-4" />
                {duplicateOrder.isPending ? "Duplicando..." : "Duplicar"}
              </DropdownMenuItem>
              {canArchive && !isArchived && (
                <DropdownMenuItem onClick={handleArchive} disabled={archiveOrder.isPending}>
                  <Archive className="mr-2 h-4 w-4" />
                  {archiveOrder.isPending ? "Archivando..." : "Archivar"}
                </DropdownMenuItem>
              )}
              {isArchived && (
                <DropdownMenuItem onClick={handleUnarchive} disabled={unarchiveOrder.isPending}>
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  {unarchiveOrder.isPending ? "Desarchivando..." : "Desarchivar"}
                </DropdownMenuItem>
              )}
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
      <ConfirmDialog />
    </div>
  )
}

interface OrderListProps {
  searchQuery?: string
}

export function OrderList({ searchQuery = "" }: OrderListProps) {
  const { statusFilter, serviceFilter, quickFilter, showArchived } = useUIStore()
  const [paymentOrder, setPaymentOrder] = useState<OrderWithClient | null>(null)
  const [editingOrder, setEditingOrder] = useState<OrderWithClient | null>(null)
  const [historyOrder, setHistoryOrder] = useState<OrderWithClient | null>(null)

  const { data: orders = [], isLoading, error } = useOrders({
    status: statusFilter !== "all" ? statusFilter : undefined,
    serviceType: serviceFilter !== "all" ? serviceFilter : undefined,
    includeArchived: showArchived,
  })

  // Apply quick filters and search client-side
  const filteredOrders = orders.filter((order) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const clientName = order.client?.name?.toLowerCase() || ""
      const description = order.description?.toLowerCase() || ""
      
      if (!clientName.includes(query) && !description.includes(query)) {
        return false
      }
    }

    // Quick filter
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
    <>
      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onPayment={setPaymentOrder}
            onEdit={setEditingOrder}
            onHistory={setHistoryOrder}
          />
        ))}
      </div>

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
    </>
  )
}
