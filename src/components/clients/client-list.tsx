"use client"

import { toast } from "sonner"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { Phone, Instagram, MoreVertical, Trash2, Pencil, MessageCircle, Send, Package, DollarSign, Calendar, FileText, Building2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useClients, useDeleteClient, type ClientWithStats } from "@/hooks/use-clients"
import { useUIStore } from "@/stores/ui-store"
import { formatRelative } from "@/lib/utils/dates"
import { getWhatsAppLink, getInstagramLink, messageTemplates } from "@/lib/utils/messaging"

function ClientCard({ client }: { client: ClientWithStats }) {
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const deleteClient = useDeleteClient()
  const { setEditingClient, setViewingClientOrders } = useUIStore()

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Eliminar cliente",
      description: `¿Estás seguro de que deseas eliminar a ${client.name}? Esta acción eliminará todos sus pedidos y no se puede deshacer.`,
      confirmText: "Eliminar",
      variant: "destructive",
    })
    if (confirmed) {
      await deleteClient.mutateAsync(client.id)
      toast.success("Cliente eliminado")
    }
  }

  const handleEdit = () => {
    setEditingClient(client)
  }

  const hasPhone = !!client.phone
  const hasInstagram = !!client.instagramHandle
  const clientFirstName = client.name.split(" ")[0]
  const totalSpent = Number(client.totalSpent || 0)
  const isCompany = client.clientType === "company"

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Client name and contact info */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{client.name}</h3>
                {isCompany && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Building2 className="h-3 w-3" />
                    Empresa
                  </Badge>
                )}
              </div>
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
                {client.cuit && (
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    CUIT: {client.cuit}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order statistics */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{client.orderCount}</span>
              <span className="text-muted-foreground">pedidos</span>
            </div>
            {totalSpent > 0 && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">${totalSpent.toLocaleString("es-AR")}</span>
                <span className="text-muted-foreground">total</span>
              </div>
            )}
            {client.lastOrderDate && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Último pedido {formatRelative(client.lastOrderDate)}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {client.notes && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {client.notes}
            </p>
          )}

          {/* Quick contact buttons */}
          <div className="mt-3 flex flex-wrap gap-2">
            {hasPhone && (
              <a
                href={getWhatsAppLink(client.phone!, messageTemplates.thanks(clientFirstName))}
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
                href={getInstagramLink(client.instagramHandle!)}
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
                href={`tel:${client.phone}`}
                className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/80 transition-colors"
              >
                Llamar
              </a>
            )}
            <button
              onClick={() => setViewingClientOrders(client)}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              Ver pedidos
            </button>
          </div>

          {/* Created at */}
          <p className="mt-2 text-xs text-muted-foreground">
            Cliente desde {formatRelative(client.createdAt)}
          </p>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setViewingClientOrders(client)}>
              <FileText className="mr-2 h-4 w-4" />
              Ver pedidos
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
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
      <ConfirmDialog />
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
            className="h-32 animate-pulse rounded-lg border bg-muted"
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
