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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUIStore } from "@/stores/ui-store"
import { useCreateClient, useUpdateClient, useClients } from "@/hooks/use-clients"
import { useCreateRelationship } from "@/hooks/use-relationships"
import { createClientSchema, clientTypeLabels, type CreateClientInput } from "@/lib/validations/clients"
import { User, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ClientType } from "@/lib/db/schema"

export function ClientFormModal() {
  const { createClientModalOpen, setCreateClientModalOpen, editingClient, setEditingClient } = useUIStore()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const createRelationship = useCreateRelationship()
  const { data: clients = [] } = useClients()
  const [error, setError] = useState("")
  const [clientType, setClientType] = useState<ClientType>("individual")
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [role, setRole] = useState("")

  // Get list of companies for the dropdown
  const companies = clients.filter(c => c.clientType === "company")

  const isEditing = !!editingClient

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      clientType: "individual",
    },
  })

  // Pre-fill form when editing
  useEffect(() => {
    if (editingClient) {
      const type = editingClient.clientType || "individual"
      setClientType(type)
      reset({
        clientType: type,
        name: editingClient.name,
        phone: editingClient.phone || "",
        instagramHandle: editingClient.instagramHandle || "",
        cuit: editingClient.cuit || "",
        notes: editingClient.notes || "",
      })
    }
  }, [editingClient, reset])

  const handleTypeChange = (type: ClientType) => {
    setClientType(type)
    setValue("clientType", type)
    // Reset company selection when switching to company type
    if (type === "company") {
      setSelectedCompanyId(null)
      setRole("")
    }
  }

  const onSubmit = async (data: CreateClientInput) => {
    setError("")
    try {
      if (isEditing) {
        await updateClient.mutateAsync({ id: editingClient.id, data })
      } else {
        const newClient = await createClient.mutateAsync(data)

        // If individual and a company is selected, create the relationship
        if (data.clientType === "individual" && selectedCompanyId) {
          await createRelationship.mutateAsync({
            personId: newClient.id,
            companyId: selectedCompanyId,
            role: role || undefined,
          })
        }
      }
      handleClose()
    } catch {
      setError(isEditing ? "Error al actualizar cliente" : "Error al crear cliente")
    }
  }

  const handleClose = () => {
    reset({ clientType: "individual", name: "", phone: "", instagramHandle: "", notes: "" })
    setClientType("individual")
    setSelectedCompanyId(null)
    setRole("")
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
          {/* Client Type Selector */}
          <div className="space-y-2">
            <Label>Tipo de cliente</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange("individual")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md border p-3 text-sm font-medium transition-colors",
                  clientType === "individual"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input hover:bg-muted"
                )}
              >
                <User className="h-4 w-4" />
                {clientTypeLabels.individual}
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("company")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md border p-3 text-sm font-medium transition-colors",
                  clientType === "company"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input hover:bg-muted"
                )}
              >
                <Building2 className="h-4 w-4" />
                {clientTypeLabels.company}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              {clientType === "company" ? "Nombre de la empresa *" : "Nombre *"}
            </Label>
            <Input
              id="name"
              placeholder={clientType === "company" ? "Empresa S.A." : "Juan Perez"}
              className="h-11 lg:h-9"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              {clientType === "company" ? "Teléfono principal" : "Teléfono"}
            </Label>
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
            <Label htmlFor="instagramHandle">
              {clientType === "company" ? "Instagram de la empresa" : "Instagram"}
            </Label>
            <Input
              id="instagramHandle"
              placeholder={clientType === "company" ? "@empresa" : "@usuario"}
              className="h-11 lg:h-9"
              {...register("instagramHandle")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuit">CUIT</Label>
            <Input
              id="cuit"
              placeholder="20-12345678-9"
              className="h-11 lg:h-9"
              {...register("cuit")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder={clientType === "company"
                ? "Notas sobre la empresa..."
                : "Notas sobre el cliente..."}
              className="min-h-[80px]"
              {...register("notes")}
            />
          </div>

          {/* Company selector for individuals (only when creating) */}
          {clientType === "individual" && !isEditing && companies.length > 0 && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="space-y-2">
                <Label>Vincular a empresa (opcional)</Label>
                <Select
                  value={selectedCompanyId || ""}
                  onValueChange={(value) => setSelectedCompanyId(value === "none" ? null : value)}
                >
                  <SelectTrigger className="h-11 lg:h-9">
                    <SelectValue placeholder="Sin empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin empresa</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCompanyId && (
                <div className="space-y-2">
                  <Label htmlFor="role">Rol en la empresa</Label>
                  <Input
                    id="role"
                    placeholder="Secretaria, Gerente, Encargado..."
                    className="h-11 lg:h-9"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {clientType === "company" && (
            <p className="text-xs text-muted-foreground">
              Después de crear la empresa, podrás agregar contactos (personas) desde la lista de clientes.
            </p>
          )}

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
