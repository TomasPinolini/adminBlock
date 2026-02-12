"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { Plus, Pencil, Trash2, Truck, Package, Search, MessageCircle, Phone, Mail } from "lucide-react"
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
import { Combobox } from "@/components/ui/combobox"
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
import { getWhatsAppLink } from "@/lib/utils/messaging"
import { EmailComposeModal } from "@/components/email-compose-modal"

export function SuppliersPanel() {
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const { data: suppliers = [], isLoading } = useSuppliers()
  const { data: materials = [] } = useMaterials()
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()
  const deleteSupplier = useDeleteSupplier()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [emailSupplier, setEmailSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
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

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const resetForm = () => {
    setFormData({ name: "", phone: "", email: "", address: "", notes: "" })
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
      email: supplier.email || "",
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
            placeholder="Buscar proveedor..."
            className="pl-9 h-11 lg:h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={openCreateModal} size="sm" className="h-11 lg:h-9">
          <Plus className="h-5 w-5 lg:mr-2 lg:h-4 lg:w-4" />
          <span className="hidden lg:inline">Nuevo proveedor</span>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Suppliers List */}
        <div className="space-y-2">
          {filteredSuppliers.length === 0 ? (
            <div className="rounded-lg border bg-background p-8 text-center">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No hay proveedores</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Agregá tu primer proveedor
              </p>
              <Button onClick={openCreateModal} className="mt-4" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Agregar proveedor
              </Button>
            </div>
          ) : (
            filteredSuppliers.map((supplier) => (
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
                <div className="flex gap-0.5 ml-2">
                  {supplier.phone && (
                    <a
                      href={getWhatsAppLink(supplier.phone, `Hola, te contacto de la imprenta.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="WhatsApp"
                    >
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-600">
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                  {supplier.phone && (
                    <a
                      href={`tel:${supplier.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      title="Llamar"
                    >
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:text-blue-500">
                        <Phone className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                  {supplier.email && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-blue-500 hover:text-blue-500"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEmailSupplier(supplier)
                      }}
                      title="Email"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditModal(supplier)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(supplier)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Supplier Materials */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm">
            {selectedSupplier
              ? `Materiales de ${selectedSupplier.name}`
              : "Seleccioná un proveedor"}
          </h2>

          {!selectedSupplier ? (
            <div className="rounded-lg border border-dashed bg-muted/50 p-8 text-center">
              <Package className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Seleccioná un proveedor para ver y agregar materiales
              </p>
            </div>
          ) : (
            <>
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
                  <Combobox
                    options={availableMaterials.map((m) => ({ value: m.id, label: `${m.name} (${m.unit})` }))}
                    value={selectedMaterialId}
                    onValueChange={setSelectedMaterialId}
                    placeholder="Seleccionar material..."
                    searchPlaceholder="Buscar material..."
                    emptyText="Sin resultados."
                    className="flex-1"
                  />
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
                  No hay materiales creados. Crealos en la pestaña Materiales.
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
              <Label htmlFor="supplier-name">Nombre *</Label>
              <Input
                id="supplier-name"
                placeholder="Nombre del proveedor"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-phone">Teléfono</Label>
              <Input
                id="supplier-phone"
                placeholder="Teléfono o WhatsApp"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-email">Email</Label>
              <Input
                id="supplier-email"
                type="email"
                placeholder="email@proveedor.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-address">Dirección</Label>
              <Input
                id="supplier-address"
                placeholder="Dirección del proveedor"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-notes">Notas</Label>
              <Input
                id="supplier-notes"
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
      {emailSupplier?.email && (
        <EmailComposeModal
          open={!!emailSupplier}
          onClose={() => setEmailSupplier(null)}
          to={emailSupplier.email}
          clientName={emailSupplier.name}
        />
      )}
      <ConfirmDialog />
    </div>
  )
}
