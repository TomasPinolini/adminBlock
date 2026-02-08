"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import {
  MoreVertical,
  Trash2,
  Pencil,
  MessageCircle,
  Send,
  FileText,
  Building2,
  User,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
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
import { getWhatsAppLink, getInstagramLink, messageTemplates } from "@/lib/utils/messaging"
import { cn } from "@/lib/utils"

interface LinkedPerson {
  id: string
  personId: string
  companyId: string
  role: string | null
  person: { id: string; name: string; phone: string | null; instagramHandle: string | null }
}

function CompanyEmployees({ companyId }: { companyId: string }) {
  const [people, setPeople] = useState<LinkedPerson[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    if (loaded) return
    setLoading(true)
    try {
      const res = await fetch(`/api/relationships?companyId=${companyId}`)
      if (res.ok) {
        const data = await res.json()
        setPeople(data)
      }
    } finally {
      setLoading(false)
      setLoaded(true)
    }
  }

  useEffect(() => { load() }, [companyId])

  if (loading) {
    return <div className="py-1 text-xs text-muted-foreground animate-pulse">Cargando...</div>
  }

  if (people.length === 0) {
    return <p className="py-1 text-xs text-muted-foreground">Sin personas vinculadas</p>
  }

  return (
    <div className="space-y-1">
      {people.map((rel) => (
        <div key={rel.id} className="flex items-center gap-2 text-xs">
          <User className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="font-medium">{rel.person.name}</span>
          {rel.role && <span className="text-muted-foreground">({rel.role})</span>}
        </div>
      ))}
    </div>
  )
}

function ClientCard({ client }: { client: ClientWithStats }) {
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const deleteClient = useDeleteClient()
  const { setEditingClient, setViewingClientOrders } = useUIStore()
  const [expanded, setExpanded] = useState(false)

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

  const hasPhone = !!client.phone
  const hasInstagram = !!client.instagramHandle
  const clientFirstName = client.name.split(" ")[0]
  const totalSpent = Number(client.totalSpent || 0)
  const isCompany = client.clientType === "company"

  return (
    <div className="rounded-lg border bg-background p-2.5 sm:p-3">
      <div className="flex items-center justify-between gap-2">
        {/* Left: name + order count + CUIT */}
        <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
          <h3 className="font-medium text-sm truncate">{client.name}</h3>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
            {client.orderCount} {client.orderCount === 1 ? "pedido" : "pedidos"}
          </Badge>
          {totalSpent > 0 && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              ${totalSpent.toLocaleString("es-AR")}
            </span>
          )}
          {client.cuit && (
            <span className="text-xs text-muted-foreground hidden lg:inline">
              CUIT: {client.cuit}
            </span>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Quick contact */}
          {hasPhone && (
            <a
              href={getWhatsAppLink(client.phone!, messageTemplates.thanks(clientFirstName))}
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp"
            >
              <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-600">
                <MessageCircle className="h-3.5 w-3.5" />
              </Button>
            </a>
          )}
          {hasInstagram && (
            <a
              href={getInstagramLink(client.instagramHandle!)}
              target="_blank"
              rel="noopener noreferrer"
              title="Instagram"
            >
              <Button variant="ghost" size="icon" className="h-7 w-7 text-pink-500 hover:text-pink-500">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </a>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-blue-600 hover:text-blue-600"
            onClick={() => setViewingClientOrders(client)}
            title="Ver pedidos"
          >
            <FileText className="h-3.5 w-3.5" />
          </Button>

          {/* Company expand */}
          {isCompany && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}
              title="Personas vinculadas"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
            </Button>
          )}

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewingClientOrders(client)}>
                <FileText className="mr-2 h-4 w-4" />
                Ver pedidos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEditingClient(client)}>
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
      </div>

      {/* Notes (single line) */}
      {client.notes && (
        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{client.notes}</p>
      )}

      {/* Expanded: linked persons for companies */}
      {isCompany && expanded && (
        <div className="mt-2 pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <Users className="h-3 w-3" /> Personas vinculadas
          </p>
          <CompanyEmployees companyId={client.id} />
        </div>
      )}

      <ConfirmDialog />
    </div>
  )
}

type ClientTypeFilter = "all" | "individual" | "company"

export function ClientList({ searchQuery }: { searchQuery: string }) {
  const { data: clients = [], isLoading, error } = useClients()
  const [typeFilter, setTypeFilter] = useState<ClientTypeFilter>("all")

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg border bg-muted"
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
    // Type filter
    if (typeFilter !== "all" && client.clientType !== typeFilter) return false
    // Search filter
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      client.name.toLowerCase().includes(query) ||
      client.phone?.toLowerCase().includes(query) ||
      client.instagramHandle?.toLowerCase().includes(query)
    )
  })

  const individualCount = clients.filter((c) => c.clientType === "individual").length
  const companyCount = clients.filter((c) => c.clientType === "company").length

  return (
    <div className="space-y-3">
      {/* Type toggle */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        <button
          onClick={() => setTypeFilter("all")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            typeFilter === "all"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Todos ({clients.length})
        </button>
        <button
          onClick={() => setTypeFilter("individual")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            typeFilter === "individual"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <User className="h-3 w-3" />
          Personas ({individualCount})
        </button>
        <button
          onClick={() => setTypeFilter("company")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            typeFilter === "company"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Building2 className="h-3 w-3" />
          Empresas ({companyCount})
        </button>
      </div>

      {filtered.length === 0 ? (
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
      ) : (
        <div className="space-y-1.5">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  )
}
