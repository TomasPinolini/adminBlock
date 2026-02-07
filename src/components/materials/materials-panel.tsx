"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { Plus, Pencil, Trash2, Package, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useMaterials,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
} from "@/hooks/use-materials"
import type { Material } from "@/lib/db/schema"

export function MaterialsPanel() {
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const { data: materials = [], isLoading } = useMaterials()
  const createMaterial = useCreateMaterial()
  const updateMaterial = useUpdateMaterial()
  const deleteMaterial = useDeleteMaterial()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    notes: "",
  })

  const filteredMaterials = materials.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const resetForm = () => {
    setFormData({ name: "", unit: "", notes: "" })
    setEditingMaterial(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (material: Material) => {
    setEditingMaterial(material)
    setFormData({
      name: material.name,
      unit: material.unit,
      notes: material.notes || "",
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingMaterial) {
        await updateMaterial.mutateAsync({
          id: editingMaterial.id,
          ...formData,
        })
      } else {
        await createMaterial.mutateAsync(formData)
      }
      setIsModalOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving material:", error)
    }
  }

  const handleDelete = async (material: Material) => {
    const confirmed = await confirm({
      title: "Eliminar material",
      description: `¿Estás seguro de que deseas eliminar "${material.name}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      variant: "destructive",
    })
    if (confirmed) {
      await deleteMaterial.mutateAsync(material.id)
      toast.success("Material eliminado")
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
      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar material..."
            className="pl-9 h-11 lg:h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={openCreateModal} size="sm" className="h-11 lg:h-9">
          <Plus className="h-5 w-5 lg:mr-2 lg:h-4 lg:w-4" />
          <span className="hidden lg:inline">Nuevo material</span>
        </Button>
      </div>

      {/* Materials List */}
      {filteredMaterials.length === 0 ? (
        <div className="rounded-lg border bg-background p-8 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">No hay materiales</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Agregá tu primer material para comenzar a cotizar
          </p>
          <Button onClick={openCreateModal} className="mt-4" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Agregar material
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="flex items-center justify-between rounded-lg border bg-background p-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">{material.name}</h3>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {material.unit}
                  </span>
                </div>
                {material.notes && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {material.notes}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditModal(material)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(material)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? "Editar Material" : "Nuevo Material"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material-name">Nombre *</Label>
              <Input
                id="material-name"
                placeholder="Ej: Papel A4, Lona, Vinilo..."
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="material-unit">Unidad *</Label>
              <Input
                id="material-unit"
                placeholder="Ej: hoja, m2, metro..."
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="material-notes">Notas (opcional)</Label>
              <Input
                id="material-notes"
                placeholder="Descripción, marca, etc."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createMaterial.isPending || updateMaterial.isPending}
              >
                {createMaterial.isPending || updateMaterial.isPending
                  ? "Guardando..."
                  : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </div>
  )
}
