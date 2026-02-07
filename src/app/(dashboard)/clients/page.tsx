"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { Plus, Search, Users, Truck, Package, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RouteErrorBoundary } from "@/components/error-boundary-route"
import { useUIStore } from "@/stores/ui-store"
import { ClientList } from "@/components/clients/client-list"
import { ClientFormModal } from "@/components/clients/client-form-modal"
import { ClientOrdersModal } from "@/components/clients/client-orders-modal"
import { ClientStats } from "@/components/clients/client-stats"
import { SuppliersPanel } from "@/components/suppliers/suppliers-panel"
import { MaterialsPanel } from "@/components/materials/materials-panel"
import { ServicesPanel } from "@/components/services/services-panel"
import { cn } from "@/lib/utils"

type Tab = "clients" | "suppliers" | "materials" | "services"

const tabs: { key: Tab; label: string; shortLabel: string; icon: typeof Users }[] = [
  { key: "clients", label: "Clientes", shortLabel: "Clientes", icon: Users },
  { key: "suppliers", label: "Proveedores", shortLabel: "Proveed.", icon: Truck },
  { key: "materials", label: "Materiales", shortLabel: "Material.", icon: Package },
  { key: "services", label: "Servicios", shortLabel: "Servicios", icon: Layers },
]

export default function ClientsPage() {
  const { setCreateClientModalOpen } = useUIStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<Tab>("clients")

  return (
    <RouteErrorBoundary
      fallbackTitle="Error en Directorio"
      fallbackMessage="No se pudo cargar la página. Otras secciones siguen funcionando."
    >
      <div className="space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold">Directorio</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Clientes, proveedores, materiales y servicios
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors flex-1 justify-center whitespace-nowrap",
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "clients" && (
          <div className="space-y-4">
            <ClientStats />

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  className="pl-9 h-11 lg:h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                onClick={() => setCreateClientModalOpen(true)}
                size="sm"
                className="h-11 lg:h-9"
              >
                <Plus className="h-5 w-5 lg:mr-2 lg:h-4 lg:w-4" />
                <span className="hidden lg:inline">Nuevo cliente</span>
              </Button>
            </div>

            <ClientList searchQuery={searchQuery} />
          </div>
        )}

        {activeTab === "suppliers" && <SuppliersPanel />}
        {activeTab === "materials" && <MaterialsPanel />}
        {activeTab === "services" && <ServicesPanel />}
      </div>

      <ClientFormModal />
      <ClientOrdersModal />
    </RouteErrorBoundary>
  )
}
