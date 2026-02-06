"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { Plus, Download, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUIStore } from "@/stores/ui-store"
import { ClientList } from "@/components/clients/client-list"
import { ClientFormModal } from "@/components/clients/client-form-modal"
import { ClientOrdersModal } from "@/components/clients/client-orders-modal"
import { ContactsModal } from "@/components/clients/contacts-modal"
import { ClientStats } from "@/components/clients/client-stats"

export default function ClientsPage() {
  const { setCreateClientModalOpen } = useUIStore()
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <>
      <div className="space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold">Clientes</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Lista de todos los clientes registrados
            </p>
          </div>
          <Button
            onClick={() => setCreateClientModalOpen(true)}
            size="sm"
            className="h-10 lg:h-9"
          >
            <Plus className="h-5 w-5 lg:mr-2 lg:h-4 lg:w-4" />
            <span className="hidden lg:inline">Nuevo cliente</span>
          </Button>
        </div>

        {/* Client Stats */}
        <ClientStats />

        {/* Search */}
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
        </div>

        {/* Client list */}
        <ClientList searchQuery={searchQuery} />
      </div>

      <ClientFormModal />
      <ClientOrdersModal />
      <ContactsModal />
    </>
  )
}
