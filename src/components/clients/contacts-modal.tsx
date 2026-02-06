"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUIStore } from "@/stores/ui-store"
import { useClients, useCreateClient } from "@/hooks/use-clients"
import { useCompanyEmployees, useCreateRelationship, useUpdateRelationship, useDeleteRelationship, type RelationshipWithPerson } from "@/hooks/use-relationships"
import { Phone, Instagram, MoreVertical, Trash2, Pencil, Plus, Users, MessageCircle, Send, UserPlus, Link } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getWhatsAppLink, getInstagramLink, messageTemplates } from "@/lib/utils/messaging"
import { createClientSchema } from "@/lib/validations/clients"
import { z } from "zod"

function EmployeeCard({
  relationship,
  onEditRole,
  onUnlink
}: {
  relationship: RelationshipWithPerson
  onEditRole: () => void
  onUnlink: () => void
}) {
  const person = relationship.person
  if (!person) return null

  const hasPhone = !!person.phone
  const hasInstagram = !!person.instagramHandle
  const firstName = person.name.split(" ")[0]

  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{person.name}</h4>
            {relationship.role && (
              <span className="text-xs text-muted-foreground">({relationship.role})</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {person.phone && (
              <a
                href={`tel:${person.phone}`}
                className="flex items-center gap-1 hover:text-foreground"
              >
                <Phone className="h-3 w-3" />
                {person.phone}
              </a>
            )}
            {person.instagramHandle && (
              <a
                href={`https://instagram.com/${person.instagramHandle.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground"
              >
                <Instagram className="h-3 w-3" />
                {person.instagramHandle}
              </a>
            )}
          </div>

          {/* Quick contact buttons */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {hasPhone && (
              <a
                href={getWhatsAppLink(person.phone!, messageTemplates.thanks(firstName))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-green-700"
              >
                <MessageCircle className="h-3 w-3" />
                WA
              </a>
            )}
            {hasInstagram && (
              <a
                href={getInstagramLink(person.instagramHandle!)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-1 text-[10px] font-medium text-white"
              >
                <Send className="h-3 w-3" />
                IG
              </a>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEditRole}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Editar rol
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onUnlink} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Desvincular
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// Form to link an existing individual to the company
function LinkExistingForm({
  companyId,
  existingPersonIds,
  onClose
}: {
  companyId: string
  existingPersonIds: string[]
  onClose: () => void
}) {
  const { data: clients = [] } = useClients()
  const createRelationship = useCreateRelationship()
  const [selectedPerson, setSelectedPerson] = useState<string>("")
  const [role, setRole] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter to only show individuals not already linked
  const availableIndividuals = clients.filter(
    c => c.clientType === "individual" && !existingPersonIds.includes(c.id)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPerson) return

    setError("")
    setIsSubmitting(true)
    try {
      await createRelationship.mutateAsync({
        personId: selectedPerson,
        companyId,
        role: role || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al vincular")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <Link className="h-4 w-4" />
        Vincular persona existente
      </h4>

      <div className="space-y-1.5">
        <Label className="text-xs">Persona *</Label>
        <Select value={selectedPerson} onValueChange={setSelectedPerson}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Seleccionar persona" />
          </SelectTrigger>
          <SelectContent>
            {availableIndividuals.length === 0 ? (
              <SelectItem value="none" disabled>
                No hay personas disponibles
              </SelectItem>
            ) : (
              availableIndividuals.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                  {client.instagramHandle && ` (${client.instagramHandle})`}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Rol en la empresa</Label>
        <Input
          placeholder="Secretaria, Gerente, Encargado..."
          className="h-9 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-9" size="sm">
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !selectedPerson}
          className="flex-1 h-9"
          size="sm"
        >
          {isSubmitting ? "Vinculando..." : "Vincular"}
        </Button>
      </div>
    </form>
  )
}

// Form to create a new individual and link to company
const newPersonSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  phone: z.string().optional(),
  instagramHandle: z.string().optional(),
  role: z.string().optional(),
})
type NewPersonInput = z.infer<typeof newPersonSchema>

function CreateNewForm({
  companyId,
  onClose
}: {
  companyId: string
  onClose: () => void
}) {
  const createClient = useCreateClient()
  const createRelationship = useCreateRelationship()
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPersonInput>({
    resolver: zodResolver(newPersonSchema),
  })

  const onSubmit = async (data: NewPersonInput) => {
    setError("")
    try {
      // Create the individual client
      const newClient = await createClient.mutateAsync({
        clientType: "individual",
        name: data.name,
        phone: data.phone,
        instagramHandle: data.instagramHandle,
      })

      // Link to company
      await createRelationship.mutateAsync({
        personId: newClient.id,
        companyId,
        role: data.role,
      })

      onClose()
    } catch {
      setError("Error al crear persona")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 border-t pt-4">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <UserPlus className="h-4 w-4" />
        Crear nueva persona
      </h4>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Nombre *</Label>
          <Input
            placeholder="Juan Pérez"
            className="h-9 text-sm"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Rol en la empresa</Label>
          <Input
            placeholder="Secretaria, Gerente..."
            className="h-9 text-sm"
            {...register("role")}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Teléfono</Label>
          <Input
            type="tel"
            placeholder="11 1234-5678"
            className="h-9 text-sm"
            {...register("phone")}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Instagram</Label>
          <Input
            placeholder="@usuario"
            className="h-9 text-sm"
            {...register("instagramHandle")}
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-9" size="sm">
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1 h-9" size="sm">
          {isSubmitting ? "Creando..." : "Crear y vincular"}
        </Button>
      </div>
    </form>
  )
}

// Edit role form
function EditRoleForm({
  relationship,
  onClose
}: {
  relationship: RelationshipWithPerson
  onClose: () => void
}) {
  const updateRelationship = useUpdateRelationship()
  const [role, setRole] = useState(relationship.role || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await updateRelationship.mutateAsync({
        id: relationship.id,
        data: { role: role || undefined },
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
      <h4 className="font-medium text-sm">
        Editar rol de {relationship.person?.name}
      </h4>

      <div className="space-y-1.5">
        <Label className="text-xs">Rol en la empresa</Label>
        <Input
          placeholder="Secretaria, Gerente, Encargado..."
          className="h-9 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-9" size="sm">
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1 h-9" size="sm">
          {isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  )
}

type FormMode = "none" | "link" | "create" | "editRole"

export function ContactsModal() {
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const { managingContactsFor, setManagingContactsFor } = useUIStore()
  const { data: employees = [], isLoading } = useCompanyEmployees(managingContactsFor?.id || null)
  const deleteRelationship = useDeleteRelationship()
  const [formMode, setFormMode] = useState<FormMode>("none")
  const [editingRelationship, setEditingRelationship] = useState<RelationshipWithPerson | null>(null)

  const handleClose = () => {
    setManagingContactsFor(null)
    setFormMode("none")
    setEditingRelationship(null)
  }

  const handleEditRole = (relationship: RelationshipWithPerson) => {
    setEditingRelationship(relationship)
    setFormMode("editRole")
  }

  const handleUnlink = async (relationship: RelationshipWithPerson) => {
    const confirmed = await confirm({
      title: "Desvincular persona",
      description: `¿Estás seguro de que deseas desvincular a ${relationship.person?.name} de esta empresa?`,
      confirmText: "Desvincular",
      variant: "destructive",
    })
    if (confirmed) {
      await deleteRelationship.mutateAsync(relationship.id)
      toast.success("Persona desvinculada")
    }
  }

  const handleFormClose = () => {
    setFormMode("none")
    setEditingRelationship(null)
  }

  const existingPersonIds = employees.map(e => e.personId)

  return (
    <Dialog open={!!managingContactsFor} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Personas de {managingContactsFor?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg border bg-muted"
                />
              ))}
            </div>
          ) : employees.length === 0 && formMode === "none" ? (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay personas vinculadas</p>
              <p className="text-xs mt-1">Vinculá o creá personas que trabajan en esta empresa</p>
            </div>
          ) : (
            <div className="space-y-2">
              {employees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  relationship={employee}
                  onEditRole={() => handleEditRole(employee)}
                  onUnlink={() => handleUnlink(employee)}
                />
              ))}
            </div>
          )}

          {/* Forms */}
          {formMode === "link" && managingContactsFor && (
            <div className="mt-4">
              <LinkExistingForm
                companyId={managingContactsFor.id}
                existingPersonIds={existingPersonIds}
                onClose={handleFormClose}
              />
            </div>
          )}

          {formMode === "create" && managingContactsFor && (
            <div className="mt-4">
              <CreateNewForm
                companyId={managingContactsFor.id}
                onClose={handleFormClose}
              />
            </div>
          )}

          {formMode === "editRole" && editingRelationship && (
            <div className="mt-4">
              <EditRoleForm
                relationship={editingRelationship}
                onClose={handleFormClose}
              />
            </div>
          )}
        </div>

        {/* Action buttons */}
        {formMode === "none" && (
          <div className="pt-4 border-t space-y-2">
            <Button onClick={() => setFormMode("link")} variant="outline" className="w-full" size="sm">
              <Link className="h-4 w-4 mr-2" />
              Vincular persona existente
            </Button>
            <Button onClick={() => setFormMode("create")} className="w-full" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Crear nueva persona
            </Button>
          </div>
        )}
      </DialogContent>
      <ConfirmDialog />
    </Dialog>
  )
}
