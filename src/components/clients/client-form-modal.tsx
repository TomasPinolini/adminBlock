"use client"

import { useState } from "react"
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
import { useCreateClient } from "@/hooks/use-clients"
import { createClientSchema, type CreateClientInput } from "@/lib/validations/clients"

export function ClientFormModal() {
  const { createClientModalOpen, setCreateClientModalOpen } = useUIStore()
  const createClient = useCreateClient()
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
  })

  const onSubmit = async (data: CreateClientInput) => {
    setError("")
    try {
      await createClient.mutateAsync(data)
      reset()
      setCreateClientModalOpen(false)
    } catch {
      setError("Error al crear cliente")
    }
  }

  const handleClose = () => {
    reset()
    setError("")
    setCreateClientModalOpen(false)
  }

  return (
    <Dialog open={createClientModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Cliente</DialogTitle>
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
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
