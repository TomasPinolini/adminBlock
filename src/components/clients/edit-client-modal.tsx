"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useUpdateClient } from "@/hooks/use-clients"
import type { ClientWithStats } from "@/hooks/use-clients"
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

interface EditClientModalProps {
  client: ClientWithStats | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditClientModal({ client, open, onOpenChange }: EditClientModalProps) {
  const updateClient = useUpdateClient()
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    cuit: "",
    notes: "",
    clientType: "individual" as "individual" | "company",
  })

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        phone: client.phone || "",
        email: client.email || "",
        cuit: client.cuit || "",
        notes: client.notes || "",
        clientType: client.clientType || "individual",
      })
    }
  }, [client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client) return

    try {
      await updateClient.mutateAsync({
        id: client.id,
        data: {
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          cuit: formData.cuit || null,
          notes: formData.notes || null,
          clientType: formData.clientType,
        },
      })
      toast.success("Cliente actualizado")
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al actualizar cliente"
      toast.error(message)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  if (!client) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientType">Tipo de Cliente</Label>
            <Select
              value={formData.clientType}
              onValueChange={(value: "individual" | "company") => 
                setFormData({ ...formData, clientType: value })
              }
            >
              <SelectTrigger id="clientType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="company">Empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={formData.clientType === "company" ? "Nombre de la empresa" : "Nombre completo"}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="11 1234-5678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="cliente@ejemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuit">CUIT</Label>
            <Input
              id="cuit"
              value={formData.cuit}
              onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
              placeholder="20-12345678-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateClient.isPending}>
              {updateClient.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
