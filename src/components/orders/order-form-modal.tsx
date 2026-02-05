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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUIStore } from "@/stores/ui-store"
import { useCreateOrder } from "@/hooks/use-orders"
import { useClients } from "@/hooks/use-clients"
import {
  createOrderSchema,
  serviceTypes,
  serviceTypeLabels,
  type CreateOrderInput,
} from "@/lib/validations/orders"

export function OrderFormModal() {
  const { createOrderModalOpen, setCreateOrderModalOpen } = useUIStore()
  const createOrder = useCreateOrder()
  const { data: clients = [] } = useClients()
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema),
  })

  const selectedClientId = watch("clientId")
  const selectedServiceType = watch("serviceType")

  const onSubmit = async (data: CreateOrderInput) => {
    setError("")
    try {
      await createOrder.mutateAsync(data)
      reset()
      setCreateOrderModalOpen(false)
    } catch {
      setError("Error al crear pedido")
    }
  }

  const handleClose = () => {
    reset()
    setError("")
    setCreateOrderModalOpen(false)
  }

  return (
    <Dialog open={createOrderModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Pedido</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select
              value={selectedClientId}
              onValueChange={(value) => setValue("clientId", value)}
            >
              <SelectTrigger className="h-11 lg:h-9">
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No hay clientes - crea uno primero
                  </SelectItem>
                ) : (
                  clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                      {client.instagramHandle && ` (${client.instagramHandle})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.clientId && (
              <p className="text-sm text-destructive">{errors.clientId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tipo de servicio *</Label>
            <Select
              value={selectedServiceType}
              onValueChange={(value) =>
                setValue("serviceType", value as CreateOrderInput["serviceType"])
              }
            >
              <SelectTrigger className="h-11 lg:h-9">
                <SelectValue placeholder="Selecciona un servicio" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((service) => (
                  <SelectItem key={service} value={service}>
                    {serviceTypeLabels[service]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.serviceType && (
              <p className="text-sm text-destructive">
                {errors.serviceType.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripcion *</Label>
            <Textarea
              id="description"
              placeholder="Detalle del trabajo..."
              className="min-h-[80px]"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                className="h-11 lg:h-9"
                {...register("price")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha entrega</Label>
              <Input
                id="dueDate"
                type="date"
                className="h-11 lg:h-9"
                {...register("dueDate")}
              />
            </div>
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
              disabled={isSubmitting || clients.length === 0}
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
