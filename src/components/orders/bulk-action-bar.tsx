"use client"

import { useState } from "react"
import { Archive, ArrowRightLeft, Trash2, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { useBulkOrders } from "@/hooks/use-bulk-orders"
import { orderStatusLabels, orderStatuses } from "@/lib/validations/orders"
import { toast } from "sonner"

interface BulkActionBarProps {
  selectedCount: number
  selectedIds: Set<string>
  onClear: () => void
  onDone: () => void
}

export function BulkActionBar({ selectedCount, selectedIds, onClear, onDone }: BulkActionBarProps) {
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const bulkOrders = useBulkOrders()
  const [statusChangeMode, setStatusChangeMode] = useState(false)

  const handleArchive = async () => {
    const confirmed = await confirm({
      title: "Archivar pedidos",
      description: `¿Archivar ${selectedCount} pedido${selectedCount > 1 ? "s" : ""}?`,
      confirmText: "Archivar",
    })
    if (!confirmed) return

    try {
      await bulkOrders.mutateAsync({
        action: "archive",
        orderIds: Array.from(selectedIds),
      })
      toast.success(`${selectedCount} pedido${selectedCount > 1 ? "s" : ""} archivado${selectedCount > 1 ? "s" : ""}`)
      onDone()
    } catch {
      toast.error("Error al archivar pedidos")
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await bulkOrders.mutateAsync({
        action: "status_change",
        orderIds: Array.from(selectedIds),
        newStatus,
      })
      toast.success(`${selectedCount} pedido${selectedCount > 1 ? "s" : ""} actualizado${selectedCount > 1 ? "s" : ""}`)
      setStatusChangeMode(false)
      onDone()
    } catch {
      toast.error("Error al cambiar estado")
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Eliminar pedidos",
      description: `¿Eliminar ${selectedCount} pedido${selectedCount > 1 ? "s" : ""} permanentemente? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      variant: "destructive",
    })
    if (!confirmed) return

    try {
      await bulkOrders.mutateAsync({
        action: "delete",
        orderIds: Array.from(selectedIds),
      })
      toast.success(`${selectedCount} pedido${selectedCount > 1 ? "s" : ""} eliminado${selectedCount > 1 ? "s" : ""}`)
      onDone()
    } catch {
      toast.error("Error al eliminar pedidos")
    }
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-3 shadow-lg lg:left-64">
        <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear}>
              <X className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {selectedCount} seleccionado{selectedCount > 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {statusChangeMode ? (
              <Select onValueChange={handleStatusChange}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue placeholder="Nuevo estado" />
                </SelectTrigger>
                <SelectContent>
                  {orderStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {orderStatusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusChangeMode(true)}
                  disabled={bulkOrders.isPending}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Cambiar estado</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleArchive}
                  disabled={bulkOrders.isPending}
                >
                  {bulkOrders.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Archive className="h-4 w-4 mr-1.5" />
                  )}
                  <span className="hidden sm:inline">Archivar</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={bulkOrders.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Eliminar</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog />
    </>
  )
}
