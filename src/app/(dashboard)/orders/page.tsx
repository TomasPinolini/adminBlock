"use client"

export const dynamic = "force-dynamic"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUIStore } from "@/stores/ui-store"
import {
  serviceTypes,
  serviceTypeLabels,
} from "@/lib/validations/orders"
import { OrderList } from "@/components/orders/order-list"
import { OrderFormModal } from "@/components/orders/order-form-modal"
import { DashboardStats } from "@/components/orders/dashboard-stats"
import { QuickFilters } from "@/components/orders/quick-filters"

export default function OrdersPage() {
  const {
    serviceFilter,
    setStatusFilter,
    setServiceFilter,
    setQuickFilter,
    setCreateOrderModalOpen,
  } = useUIStore()

  const handleStatsFilterChange = (filter: string) => {
    if (filter === "overdue") {
      setQuickFilter("overdue")
    } else if (filter === "due_today") {
      setQuickFilter("due_today")
    } else {
      setStatusFilter(filter as any)
    }
  }

  return (
    <>
      <div className="space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold">Pedidos</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Gestiona todos los pedidos del negocio
            </p>
          </div>
          <Button
            onClick={() => setCreateOrderModalOpen(true)}
            size="sm"
            className="h-10 lg:h-9"
          >
            <Plus className="h-5 w-5 lg:mr-2 lg:h-4 lg:w-4" />
            <span className="hidden lg:inline">Nuevo pedido</span>
          </Button>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats onFilterChange={handleStatsFilterChange} />

        {/* Quick Filters */}
        <QuickFilters />

        {/* Service Filter */}
        <div className="flex items-center gap-3">
          <Select
            value={serviceFilter}
            onValueChange={(value) =>
              setServiceFilter(value as typeof serviceFilter)
            }
          >
            <SelectTrigger className="w-full sm:w-[180px] h-10 lg:h-9">
              <SelectValue placeholder="Tipo de servicio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los servicios</SelectItem>
              {serviceTypes.map((service) => (
                <SelectItem key={service} value={service}>
                  {serviceTypeLabels[service]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Orders list */}
        <OrderList />
      </div>

      <OrderFormModal />
    </>
  )
}
