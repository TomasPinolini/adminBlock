"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { Plus, Trash2, Edit, Package, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from "@/hooks/use-services"
import type { Service } from "@/lib/db/schema"

export function ServicesPanel() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
  })

  const { data: services = [], isLoading } = useServices()
  const createService = useCreateService()
  const updateService = useUpdateService()
  const deleteService = useDeleteService()
  const { confirm, ConfirmDialog } = useConfirmDialog()

  const filteredServices = services.filter((s) =>
    s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenCreate = () => {
    setFormData({ name: "", displayName: "", description: "" })
    setIsCreateOpen(true)
  }

  const handleOpenEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      displayName: service.displayName,
      description: service.description || "",
    })
  }

  const handleCloseDialog = () => {
    setIsCreateOpen(false)
    setEditingService(null)
    setFormData({ name: "", displayName: "", description: "" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingService) {
        await updateService.mutateAsync({
          id: editingService.id,
          name: formData.name.toLowerCase().trim(),
          displayName: formData.displayName.trim(),
          description: formData.description.trim() || null,
        })
        toast.success("Servicio actualizado")
      } else {
        await createService.mutateAsync({
          name: formData.name.toLowerCase().trim(),
          displayName: formData.displayName.trim(),
          description: formData.description.trim() || undefined,
        })
        toast.success("Servicio creado")
      }
      handleCloseDialog()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar servicio")
    }
  }

  const handleDelete = async (service: Service) => {
    const confirmed = await confirm({
      title: "Eliminar servicio",
      description: `¿Estás seguro de que deseas eliminar "${service.displayName}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      variant: "destructive",
    })

    if (confirmed) {
      try {
        await deleteService.mutateAsync(service.id)
        toast.success("Servicio eliminado")
      } catch (error) {
        toast.error("Error al eliminar servicio")
      }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ConfirmDialog />

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar servicio..."
            className="pl-9 h-11 lg:h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="h-11 lg:h-9">
          <Plus className="h-5 w-5 lg:mr-2 lg:h-4 lg:w-4" />
          <span className="hidden lg:inline">Nuevo servicio</span>
        </Button>
      </div>

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/50 p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">No hay servicios</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Comienza creando tu primer tipo de servicio
          </p>
          <Button onClick={handleOpenCreate} className="mt-4" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Crear Servicio
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between rounded-lg border bg-background p-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{service.displayName}</h3>
                  <span className="text-xs text-muted-foreground">({service.name})</span>
                </div>
                {service.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenEdit(service)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(service)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingService} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Editar Servicio" : "Nuevo Servicio"}
              </DialogTitle>
              <DialogDescription>
                {editingService
                  ? "Modifica los datos del servicio"
                  : "Crea un nuevo tipo de servicio"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="service-name">
                  Nombre interno <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="service-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="copiado, tesis, encuadernacion..."
                  required
                  disabled={!!editingService}
                />
                <p className="text-xs text-muted-foreground">
                  Minúsculas, sin espacios. Se usa internamente en el sistema.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-displayName">
                  Nombre para mostrar <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="service-displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Copiado, Tesis, Encuadernación..."
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Como se mostrará en la interfaz
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-description">Descripción (opcional)</Label>
                <Textarea
                  id="service-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del servicio..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  !formData.name.trim() ||
                  !formData.displayName.trim() ||
                  createService.isPending ||
                  updateService.isPending
                }
              >
                {editingService ? "Guardar Cambios" : "Crear Servicio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
