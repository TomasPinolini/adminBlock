"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { Plus, Archive, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RouteErrorBoundary } from "@/components/error-boundary-route"
import { useUIStore } from "@/stores/ui-store"
import {
  serviceTypes,
  serviceTypeLabels,
  orderStatuses,
} from "@/lib/validations/orders"
import { OrderList } from "@/components/orders/order-list"
import { OrderFormModal } from "@/components/orders/order-form-modal"
import { DashboardStats } from "@/components/orders/dashboard-stats"
import { QuickFilters } from "@/components/orders/quick-filters"

export default function OrdersPage() {
  const {
    serviceFilter,
    showArchived,
    setStatusFilter,
    setServiceFilter,
    setQuickFilter,
    setShowArchived,
    setCreateOrderModalOpen,
  } = useUIStore()
  const [searchQuery, setSearchQuery] = useState("")

  const handleStatsFilterChange = (filter: string) => {
    if (filter === "overdue") {
      setQuickFilter("overdue")
    } else if (filter === "due_today") {
      setQuickFilter("due_today")
    } else {
      setStatusFilter(filter as typeof orderStatuses[number] | "all")
    }
  }

  return (
    <RouteErrorBoundary
      fallbackTitle="Error en Pedidos"
      fallbackMessage="No se pudo cargar la página de pedidos. Otras secciones siguen funcionando."
    >
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

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o descripción..."
              className="pl-9 h-11 lg:h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

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

          <Button
            variant={showArchived ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className="h-10 lg:h-9"
          >
            <Archive className="h-4 w-4 mr-2" />
            {showArchived ? "Ocultando archivados" : "Ver archivados"}
          </Button>
        </div>

        {/* Orders list */}
        <OrderList searchQuery={searchQuery} />
      </div>

      <OrderFormModal />
    </RouteErrorBoundary>
  )
}
