"use client"

import { useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useUIStore } from "@/stores/ui-store"
import { useOrders } from "@/hooks/use-orders"
import { useCompanyEmployees } from "@/hooks/use-relationships"
import { formatDate, formatRelative } from "@/lib/utils/dates"
import {
  serviceTypeLabels,
  orderStatusLabels,
} from "@/lib/validations/orders"
import type { OrderStatus, PaymentStatus } from "@/lib/db/schema"
import { Package, DollarSign, Calendar, Clock, User } from "lucide-react"

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

export function ClientOrdersModal() {
  const { viewingClientOrders, setViewingClientOrders } = useUIStore()
  const isCompany = viewingClientOrders?.clientType === "company"

  // For companies, fetch linked individuals
  const { data: employees = [] } = useCompanyEmployees(isCompany ? viewingClientOrders?.id || null : null)

  // Fetch all orders (we'll filter client-side)
  const { data: allOrders = [], isLoading } = useOrders()

  // Filter orders to include:
  // - Orders directly for this client
  // - For companies: also orders from linked individuals
  const orders = useMemo(() => {
    if (!viewingClientOrders) return []

    const clientId = viewingClientOrders.id
    const linkedPersonIds = employees.map(e => e.personId)

    return allOrders.filter(order => {
      // Direct orders for this client
      if (order.clientId === clientId) return true
      // For companies: include orders from linked individuals
      if (isCompany && linkedPersonIds.includes(order.clientId)) return true
      return false
    })
  }, [allOrders, viewingClientOrders, employees, isCompany])

  // Create a map of personId -> person name for display
  const personNames = useMemo(() => {
    const map: Record<string, string> = {}
    employees.forEach(e => {
      if (e.person) {
        map[e.personId] = e.person.name
      }
    })
    return map
  }, [employees])

  const handleClose = () => {
    setViewingClientOrders(null)
  }

  const totalSpent = orders.reduce((sum, order) => {
    if (order.status === "delivered" || order.status === "ready") {
      return sum + Number(order.price || 0)
    }
    return sum
  }, 0)

  const totalPaid = orders.reduce((sum, order) => {
    return sum + Number(order.paymentAmount || 0)
  }, 0)

  return (
    <Dialog open={!!viewingClientOrders} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Pedidos de {viewingClientOrders?.name}</DialogTitle>
        </DialogHeader>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{orders.length}</span>
            <span className="text-muted-foreground">pedidos</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">${totalSpent.toLocaleString("es-AR")}</span>
            <span className="text-muted-foreground">total</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-600">${totalPaid.toLocaleString("es-AR")}</span>
            <span className="text-muted-foreground">pagado</span>
          </div>
        </div>

        {/* Orders list */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg border bg-muted"
                />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay pedidos para este cliente</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {orders.map((order) => {
                const paymentStatus = (order.paymentStatus || "pending") as PaymentStatus
                // Check if this order is from a linked individual (not the company directly)
                const isFromLinkedPerson = isCompany && order.clientId !== viewingClientOrders?.id
                const personName = isFromLinkedPerson ? personNames[order.clientId] : null

                return (
                  <div
                    key={order.id}
                    className="rounded-lg border bg-background p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {serviceTypeLabels[order.serviceType]}
                          </Badge>
                          <Badge variant={statusVariants[order.status]}>
                            {orderStatusLabels[order.status]}
                          </Badge>
                          {order.price && Number(order.price) > 0 && (
                            <Badge variant={paymentStatusVariants[paymentStatus]} className="text-xs">
                              {paymentStatusLabels[paymentStatus]}
                            </Badge>
                          )}
                        </div>
                        {/* Show who made the order if it's from a linked person */}
                        {personName && (
                          <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Pedido por: <span className="font-medium">{personName}</span>
                          </p>
                        )}
                        {order.description && (
                          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                            {order.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          {order.price && Number(order.price) > 0 && (
                            <span className="font-medium text-foreground">
                              ${Number(order.price).toLocaleString("es-AR")}
                            </span>
                          )}
                          {order.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(order.dueDate)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelative(order.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
