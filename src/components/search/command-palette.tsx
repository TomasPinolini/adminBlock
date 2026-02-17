"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
  ClipboardList,
  Users,
  Calculator,
  Plus,
} from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { useUIStore } from "@/stores/ui-store"
import type { OrderWithClient } from "@/hooks/use-orders"
import type { Client } from "@/lib/db/schema"

export function CommandPalette() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const open = useUIStore((s) => s.commandPaletteOpen)
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen)
  const setCreateOrderModalOpen = useUIStore((s) => s.setCreateOrderModalOpen)
  const setCreateClientModalOpen = useUIStore((s) => s.setCreateClientModalOpen)
  const setFocusOrderId = useUIStore((s) => s.setFocusOrderId)
  const setEditingClient = useUIStore((s) => s.setEditingClient)

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setOpen(!open)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, setOpen])

  // Read from React Query cache
  const cachedOrders = useMemo(() => {
    const queries = queryClient.getQueriesData<OrderWithClient[]>({ queryKey: ["orders"] })
    const allOrders = new Map<string, OrderWithClient>()
    for (const [, data] of queries) {
      if (data) {
        for (const order of data) {
          allOrders.set(order.id, order)
        }
      }
    }
    return Array.from(allOrders.values())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, open]) // Re-read when palette opens

  const cachedClients = useMemo(() => {
    const queries = queryClient.getQueriesData<Client[]>({ queryKey: ["clients"] })
    const allClients = new Map<string, Client>()
    for (const [, data] of queries) {
      if (data) {
        for (const client of data) {
          allClients.set(client.id, client)
        }
      }
    }
    return Array.from(allClients.values())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, open])

  const handleSelectOrder = (order: OrderWithClient) => {
    setOpen(false)
    setFocusOrderId(order.id)
    router.push("/orders")
  }

  const handleSelectClient = (client: Client) => {
    setOpen(false)
    setEditingClient(client)
    router.push("/clients")
  }

  const handleAction = (action: string) => {
    setOpen(false)
    switch (action) {
      case "new-order":
        setCreateOrderModalOpen(true)
        router.push("/orders")
        break
      case "new-client":
        setCreateClientModalOpen(true)
        router.push("/clients")
        break
      case "quotes":
        router.push("/quotes")
        break
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-[520px]">
        <DialogTitle className="sr-only">Buscar</DialogTitle>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
          <CommandInput placeholder="Buscar pedidos, clientes, acciones..." />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>

            {/* Quick actions */}
            <CommandGroup heading="Acciones rapidas">
              <CommandItem onSelect={() => handleAction("new-order")}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo pedido
              </CommandItem>
              <CommandItem onSelect={() => handleAction("new-client")}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo cliente
              </CommandItem>
              <CommandItem onSelect={() => handleAction("quotes")}>
                <Calculator className="mr-2 h-4 w-4" />
                Ir a cotizador
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            {/* Orders */}
            {cachedOrders.length > 0 && (
              <CommandGroup heading="Pedidos">
                {cachedOrders.slice(0, 10).map((order) => (
                  <CommandItem
                    key={order.id}
                    value={`order ${order.client?.name || ""} ${order.description || ""} ${order.serviceType}`}
                    onSelect={() => handleSelectOrder(order)}
                  >
                    <ClipboardList className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {order.client?.name || "Sin cliente"} — {order.serviceType}
                      </span>
                      {order.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-[400px]">
                          {order.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandSeparator />

            {/* Clients */}
            {cachedClients.length > 0 && (
              <CommandGroup heading="Clientes">
                {cachedClients.slice(0, 10).map((client) => (
                  <CommandItem
                    key={client.id}
                    value={`client ${client.name} ${client.email || ""} ${client.phone || ""}`}
                    onSelect={() => handleSelectClient(client)}
                  >
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm">{client.name}</span>
                      {(client.email || client.phone) && (
                        <span className="text-xs text-muted-foreground">
                          {[client.email, client.phone].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
