"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useUpdateOrder } from "@/hooks/use-orders"
import type { OrderWithClient } from "@/hooks/use-orders"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { serviceTypeLabels, serviceTypes } from "@/lib/validations/orders"

interface EditOrderModalProps {
  order: OrderWithClient | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditOrderModal({ order, open, onOpenChange }: EditOrderModalProps) {
  const updateOrder = useUpdateOrder()
  const [formData, setFormData] = useState({
    description: "",
    price: "",
    dueDate: "",
    serviceType: "",
  })

  useEffect(() => {
    if (order) {
      setFormData({
        description: order.description || "",
        price: order.price || "",
        dueDate: order.dueDate || "",
        serviceType: order.serviceType || "",
      })
    }
  }, [order])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return

    try {
      await updateOrder.mutateAsync({
        id: order.id,
        data: {
          description: formData.description,
          price: formData.price || null,
          dueDate: formData.dueDate || null,
          serviceType: formData.serviceType as typeof serviceTypes[number],
        },
      })
      toast.success("Pedido actualizado")
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al actualizar pedido"
      toast.error(message)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Pedido</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serviceType">Tipo de Servicio</Label>
            <Select
              value={formData.serviceType}
              onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
            >
              <SelectTrigger id="serviceType">
                <SelectValue placeholder="Seleccionar servicio" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {serviceTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalles del pedido"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Precio</Label>
            <Input
              id="price"
              type="text"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="$0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Fecha de Entrega</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateOrder.isPending}>
              {updateOrder.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
