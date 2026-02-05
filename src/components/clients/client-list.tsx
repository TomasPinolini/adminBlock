"use client"

import { Phone, Instagram, MoreVertical, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useClients, useDeleteClient } from "@/hooks/use-clients"
import { formatRelative } from "@/lib/utils/dates"
import type { Client } from "@/lib/db/schema"

function ClientCard({ client }: { client: Client }) {
  const deleteClient = useDeleteClient()

  const handleDelete = async () => {
    if (confirm(`Eliminar a ${client.name}?`)) {
      await deleteClient.mutateAsync(client.id)
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border bg-background p-4">
      <div className="min-w-0 flex-1">
        <h3 className="font-medium truncate">{client.name}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              className="flex items-center gap-1 hover:text-foreground"
            >
              <Phone className="h-3 w-3" />
              {client.phone}
            </a>
          )}
          {client.instagramHandle && (
            <a
              href={`https://instagram.com/${client.instagramHandle.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              <Instagram className="h-3 w-3" />
              {client.instagramHandle}
            </a>
          )}
        </div>
        {client.notes && (
          <p className="mt-1 text-sm text-muted-foreground truncate">
            {client.notes}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Agregado {formatRelative(client.createdAt)}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
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
  )
}

export function ClientList({ searchQuery }: { searchQuery: string }) {
  const { data: clients = [], isLoading, error } = useClients()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg border bg-muted"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-background p-6 text-center">
        <p className="text-destructive">Error al cargar clientes</p>
      </div>
    )
  }

  const filtered = clients.filter((client) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      client.name.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query) ||
      client.instagramHandle?.toLowerCase().includes(query)
    )
  })

  if (filtered.length === 0) {
    return (
      <div className="rounded-lg border bg-background p-6 lg:p-8 text-center text-muted-foreground">
        <p className="text-base lg:text-lg font-medium">
          {searchQuery ? "No se encontraron clientes" : "No hay clientes"}
        </p>
        <p className="text-sm mt-1">
          {searchQuery
            ? "Intenta con otra busqueda"
            : "Agrega tu primer cliente para comenzar"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {filtered.map((client) => (
        <ClientCard key={client.id} client={client} />
      ))}
    </div>
  )
}
