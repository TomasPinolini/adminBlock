"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Phone, DollarSign } from "lucide-react"
import type { TermocopiadoEntry } from "@/hooks/use-termocopiados"
import type { TermocopiadoMetadata } from "@/lib/db/schema"

interface TermocopiadoCardProps {
  entry: TermocopiadoEntry
  onEdit: (entry: TermocopiadoEntry) => void
  onDelete: (entry: TermocopiadoEntry) => void
}

export function TermocopiadoCard({ entry, onEdit, onDelete }: TermocopiadoCardProps) {
  const meta = entry.metadata as TermocopiadoMetadata | null
  const time = new Date(entry.createdAt).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const isPaid = entry.paymentStatus === "paid"

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 sm:p-4">
      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-base truncate">
            {entry.client?.name || "Sin cliente"}
          </span>
          <Badge variant={isPaid ? "default" : "secondary"} className="text-xs">
            {isPaid ? "Pagado" : entry.paymentStatus === "partial" ? "Parcial" : "Pendiente"}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          {meta && (
            <span>{meta.libros} libros, {meta.copias} copias</span>
          )}
          {entry.client?.phone && (
            <span className="hidden sm:flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {entry.client.phone}
            </span>
          )}
        </div>
      </div>

      {/* Price + time */}
      <div className="text-right shrink-0">
        <div className="flex items-center gap-1 font-semibold text-base">
          <DollarSign className="h-4 w-4" />
          {entry.price ? Number(entry.price).toLocaleString("es-AR") : "—"}
        </div>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(entry)}
          className="h-9 w-9 p-0"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(entry)}
          className="h-9 w-9 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
