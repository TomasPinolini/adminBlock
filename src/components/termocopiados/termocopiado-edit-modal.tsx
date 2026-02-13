"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUpdateTermocopiado } from "@/hooks/use-termocopiados"
import type { TermocopiadoEntry } from "@/hooks/use-termocopiados"
import type { TermocopiadoMetadata } from "@/lib/db/schema"
import { toast } from "sonner"

interface TermocopiadoEditModalProps {
  entry: TermocopiadoEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TermocopiadoEditModal({ entry, open, onOpenChange }: TermocopiadoEditModalProps) {
  const updateTermocopiado = useUpdateTermocopiado()
  const [libros, setLibros] = useState("")
  const [copias, setCopias] = useState("")
  const [precio, setPrecio] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "partial" | "paid">("pending")

  useEffect(() => {
    if (entry) {
      const meta = entry.metadata as TermocopiadoMetadata | null
      setLibros(String(meta?.libros ?? ""))
      setCopias(String(meta?.copias ?? ""))
      setPrecio(entry.price ?? "")
      setPaymentStatus(entry.paymentStatus)
    }
  }, [entry])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entry) return

    try {
      await updateTermocopiado.mutateAsync({
        id: entry.id,
        data: {
          libros: parseInt(libros) || undefined,
          copias: parseInt(copias) || undefined,
          precio: precio || undefined,
          paymentStatus,
        },
      })
      toast.success("Termocopiado actualizado")
      onOpenChange(false)
    } catch {
      toast.error("Error al actualizar")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar termocopiado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {entry?.client && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <span className="font-medium">{entry.client.name}</span>
              {entry.client.address && (
                <p className="text-muted-foreground">{entry.client.address}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Libros</Label>
              <Input
                value={libros}
                onChange={(e) => setLibros(e.target.value)}
                inputMode="numeric"
                className="h-12 text-lg text-center"
              />
            </div>
            <div className="space-y-1">
              <Label>Copias</Label>
              <Input
                value={copias}
                onChange={(e) => setCopias(e.target.value)}
                inputMode="numeric"
                className="h-12 text-lg text-center"
              />
            </div>
            <div className="space-y-1">
              <Label>Precio $</Label>
              <Input
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                inputMode="decimal"
                className="h-12 text-lg text-center"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Estado de pago</Label>
            <Select
              value={paymentStatus}
              onValueChange={(v) => setPaymentStatus(v as typeof paymentStatus)}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="partial">Parcial</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 text-base"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateTermocopiado.isPending}
              className="flex-1 h-12 text-base font-bold"
            >
              {updateTermocopiado.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
