"use client"

import { useMemo, useState } from "react"
import { TermocopiadoCard } from "./termocopiado-card"
import { TermocopiadoEditModal } from "./termocopiado-edit-modal"
import { useDeleteTermocopiado } from "@/hooks/use-termocopiados"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import type { TermocopiadoEntry } from "@/hooks/use-termocopiados"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface TermocopiadoListProps {
  entries: TermocopiadoEntry[]
  isLoading: boolean
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (sameDay(date, today)) return "Hoy"
  if (sameDay(date, yesterday)) return "Ayer"
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

export function TermocopiadoList({ entries, isLoading }: TermocopiadoListProps) {
  const deleteTermocopiado = useDeleteTermocopiado()
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const [editingEntry, setEditingEntry] = useState<TermocopiadoEntry | null>(null)

  // Group entries by date
  const grouped = useMemo(() => {
    const groups: { label: string; entries: TermocopiadoEntry[] }[] = []
    let currentLabel = ""

    for (const entry of entries) {
      const label = getDateLabel(entry.createdAt as unknown as string)
      if (label !== currentLabel) {
        currentLabel = label
        groups.push({ label, entries: [] })
      }
      groups[groups.length - 1].entries.push(entry)
    }

    return groups
  }, [entries])

  const handleDelete = async (entry: TermocopiadoEntry) => {
    const confirmed = await confirm({
      title: "Eliminar termocopiado",
      description: `¿Eliminar termocopiado de ${entry.client?.name || "cliente"}?`,
      confirmText: "Eliminar",
      variant: "destructive",
    })
    if (!confirmed) return
    try {
      await deleteTermocopiado.mutateAsync(entry.id)
      toast.success("Termocopiado eliminado")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">Sin termocopiados todavía</p>
        <p className="text-sm mt-1">Usá el formulario de arriba para agregar el primero</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {grouped.map((group) => (
          <div key={group.label}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 sticky top-0 bg-background py-1">
              {group.label}
            </h3>
            <div className="space-y-2">
              {group.entries.map((entry) => (
                <TermocopiadoCard
                  key={entry.id}
                  entry={entry}
                  onEdit={setEditingEntry}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <TermocopiadoEditModal
        entry={editingEntry}
        open={!!editingEntry}
        onOpenChange={(open) => !open && setEditingEntry(null)}
      />
      <ConfirmDialog />
    </>
  )
}
