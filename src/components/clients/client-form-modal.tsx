"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { useUIStore } from "@/stores/ui-store"
import { useCreateClient, useUpdateClient } from "@/hooks/use-clients"
import { createClientSchema, type CreateClientInput } from "@/lib/validations/clients"

export function ClientFormModal() {
  const { createClientModalOpen, setCreateClientModalOpen, editingClient, setEditingClient } = useUIStore()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const [error, setError] = useState("")

  const isEditing = !!editingClient

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
  })

  // Pre-fill form when editing
  useEffect(() => {
    if (editingClient) {
      reset({
        name: editingClient.name,
        phone: editingClient.phone || "",
        instagramHandle: editingClient.instagramHandle || "",
        notes: editingClient.notes || "",
      })
    }
  }, [editingClient, reset])

  const onSubmit = async (data: CreateClientInput) => {
    setError("")
    try {
      if (isEditing) {
        await updateClient.mutateAsync({ id: editingClient.id, data })
      } else {
        await createClient.mutateAsync(data)
      }
      handleClose()
    } catch {
      setError(isEditing ? "Error al actualizar cliente" : "Error al crear cliente")
    }
  }

  const handleClose = () => {
    reset({ name: "", phone: "", instagramHandle: "", notes: "" })
    setError("")
    setEditingClient(null)
    setCreateClientModalOpen(false)
  }

  return (
    <Dialog open={createClientModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              placeholder="Juan Perez"
              className="h-11 lg:h-9"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefono</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="11 1234-5678"
              className="h-11 lg:h-9"
              {...register("phone")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagramHandle">Instagram</Label>
            <Input
              id="instagramHandle"
              placeholder="@usuario"
              className="h-11 lg:h-9"
              {...register("instagramHandle")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas sobre el cliente..."
              className="min-h-[80px]"
              {...register("notes")}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-11 lg:h-9"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-11 lg:h-9"
            >
              {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
