"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { Plus, Pencil, Trash2, Truck, ArrowLeft, Package } from "lucide-react"
import Link from "next/link"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  useSupplierMaterials,
  useAddSupplierMaterial,
  useUpdateSupplierMaterial,
  useRemoveSupplierMaterial,
} from "@/hooks/use-suppliers"
import { useMaterials } from "@/hooks/use-materials"
import type { Supplier } from "@/lib/db/schema"

export default function SuppliersPage() {
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const { data: suppliers = [], isLoading } = useSuppliers()
  const { data: materials = [] } = useMaterials()
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()
  const deleteSupplier = useDeleteSupplier()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  })

  // Materials for selected supplier
  const { data: supplierMaterials = [] } = useSupplierMaterials(
    selectedSupplier?.id
  )
  const addSupplierMaterial = useAddSupplierMaterial()
  const updateSupplierMaterial = useUpdateSupplierMaterial()
  const removeSupplierMaterial = useRemoveSupplierMaterial()

  const [selectedMaterialId, setSelectedMaterialId] = useState("")
  const [materialPrice, setMaterialPrice] = useState("")

  const assignedMaterialIds = supplierMaterials.map((sm) => sm.materialId)
  const availableMaterials = materials.filter(
    (m) => !assignedMaterialIds.includes(m.id)
  )

  const resetForm = () => {
    setFormData({ name: "", phone: "", address: "", notes: "" })
    setEditingSupplier(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      phone: supplier.phone || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingSupplier) {
        await updateSupplier.mutateAsync({
          id: editingSupplier.id,
          ...formData,
        })
      } else {
        await createSupplier.mutateAsync(formData)
      }
      setIsModalOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving supplier:", error)
    }
  }

  const handleDelete = async (supplier: Supplier) => {
    const confirmed = await confirm({
      title: "Eliminar proveedor",
      description: `¿Estás seguro de que deseas eliminar a "${supplier.name}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      variant: "destructive",
    })
    if (confirmed) {
      await deleteSupplier.mutateAsync(supplier.id)
      if (selectedSupplier?.id === supplier.id) {
        setSelectedSupplier(null)
      }
      toast.success("Proveedor eliminado")
    }
  }

  const handleAddMaterial = async () => {
    if (!selectedSupplier || !selectedMaterialId) return

    try {
      await addSupplierMaterial.mutateAsync({
        supplierId: selectedSupplier.id,
        materialId: selectedMaterialId,
        currentPrice: materialPrice || undefined,
      })
      setSelectedMaterialId("")
      setMaterialPrice("")
    } catch (error) {
      console.error("Error adding material:", error)
    }
  }

  const handleUpdatePrice = async (id: string, newPrice: string) => {
    try {
      await updateSupplierMaterial.mutateAsync({
        id,
        currentPrice: newPrice,
      })
    } catch (error) {
      console.error("Error updating price:", error)
    }
  }

  const handleRemoveMaterial = async (id: string) => {
    try {
      await removeSupplierMaterial.mutateAsync(id)
    } catch (error) {
      console.error("Error removing material:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl lg:text-2xl font-bold">Proveedores</h1>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold">Proveedores</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona proveedores y sus materiales con precios
            </p>
          </div>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Suppliers List */}
        <div className="space-y-3">
          <h2 className="font-semibold">Lista de Proveedores</h2>
          {suppliers.length === 0 ? (
            <div className="rounded-lg border bg-background p-8 text-center">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No hay proveedores</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Agregá tu primer proveedor
              </p>
              <Button onClick={openCreateModal} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Agregar proveedor
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className={`flex items-center justify-between rounded-lg border bg-background p-3 cursor-pointer transition-colors ${
                    selectedSupplier?.id === supplier.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedSupplier(supplier)}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{supplier.name}</h3>
                    {supplier.phone && (
                      <p className="text-sm text-muted-foreground truncate">
                        {supplier.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditModal(supplier)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(supplier)
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Supplier Materials */}
        <div className="space-y-3">
          <h2 className="font-semibold">
            {selectedSupplier
              ? `Materiales de ${selectedSupplier.name}`
              : "Selecciona un proveedor"}
          </h2>

          {!selectedSupplier ? (
            <div className="rounded-lg border border-dashed bg-muted/50 p-8 text-center">
              <Package className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Selecciona un proveedor para ver y agregar materiales
              </p>
            </div>
          ) : (
            <>
              {/* Materials list */}
              {supplierMaterials.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/50 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Este proveedor no tiene materiales asignados
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {supplierMaterials.map((sm) => (
                    <div
                      key={sm.id}
                      className="flex items-center gap-3 rounded-lg border bg-background p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{sm.material?.name}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({sm.material?.unit})
                        </span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Precio"
                        className="w-28"
                        defaultValue={sm.currentPrice || ""}
                        onBlur={(e) => {
                          if (e.target.value !== (sm.currentPrice || "")) {
                            handleUpdatePrice(sm.id, e.target.value)
                          }
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMaterial(sm.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add material */}
              {availableMaterials.length > 0 ? (
                <div className="flex gap-2 pt-2">
                  <Select
                    value={selectedMaterialId}
                    onValueChange={setSelectedMaterialId}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar material..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMaterials.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name} ({material.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Precio"
                    className="w-28"
                    value={materialPrice}
                    onChange={(e) => setMaterialPrice(e.target.value)}
                  />
                  <Button
                    onClick={handleAddMaterial}
                    disabled={!selectedMaterialId || addSupplierMaterial.isPending}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : materials.length === 0 ? (
                <p className="text-sm text-muted-foreground pt-2">
                  No hay materiales creados.{" "}
                  <Link href="/settings/materials" className="text-primary underline">
                    Crear materiales primero
                  </Link>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground pt-2">
                  Todos los materiales ya están asignados a este proveedor.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                placeholder="Nombre del proveedor"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                placeholder="Teléfono o WhatsApp"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                placeholder="Dirección del proveedor"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Input
                id="notes"
                placeholder="Notas adicionales"
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
                disabled={createSupplier.isPending || updateSupplier.isPending}
              >
                {createSupplier.isPending || updateSupplier.isPending
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
