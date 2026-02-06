"use client"

import { useState } from "react"
import { Plus, Trash2, ArrowLeft, Layers } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useMaterials,
  useServiceMaterials,
  useAddServiceMaterial,
  useRemoveServiceMaterial,
} from "@/hooks/use-materials"
import { serviceTypes, serviceTypeLabels } from "@/lib/validations/orders"

export default function ServicesPage() {
  const [selectedService, setSelectedService] = useState<string>(serviceTypes[0])
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("")

  const { data: materials = [] } = useMaterials()
  const { data: serviceMaterials = [], isLoading } = useServiceMaterials(selectedService)
  const addServiceMaterial = useAddServiceMaterial()
  const removeServiceMaterial = useRemoveServiceMaterial()

  const assignedMaterialIds = serviceMaterials.map((sm) => sm.materialId)
  const availableMaterials = materials.filter(
    (m) => !assignedMaterialIds.includes(m.id)
  )

  const handleAddMaterial = async () => {
    if (!selectedMaterialId) return

    try {
      await addServiceMaterial.mutateAsync({
        serviceType: selectedService,
        materialId: selectedMaterialId,
      })
      setSelectedMaterialId("")
    } catch (error) {
      console.error("Error adding material:", error)
    }
  }

  const handleRemoveMaterial = async (id: string) => {
    try {
      await removeServiceMaterial.mutateAsync(id)
    } catch (error) {
      console.error("Error removing material:", error)
    }
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">Materiales por Servicio</h1>
          <p className="text-sm text-muted-foreground">
            Configura qué materiales se usan en cada tipo de servicio
          </p>
        </div>
      </div>

      {/* Service Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Tipo de servicio</label>
        <Select value={selectedService} onValueChange={setSelectedService}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {serviceTypes.map((service) => (
              <SelectItem key={service} value={service}>
                {serviceTypeLabels[service]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Materials for selected service */}
      <div className="space-y-4">
        <h2 className="font-semibold">
          Materiales para {serviceTypeLabels[selectedService as keyof typeof serviceTypeLabels]}
        </h2>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg border bg-muted" />
            ))}
          </div>
        ) : serviceMaterials.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/50 p-6 text-center">
            <Layers className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No hay materiales asignados a este servicio
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {serviceMaterials.map((sm) => (
              <div
                key={sm.id}
                className="flex items-center justify-between rounded-lg border bg-background p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{sm.material?.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({sm.material?.unit})
                  </span>
                </div>
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
        {availableMaterials.length > 0 && (
          <div className="flex gap-2">
            <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
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
            <Button
              onClick={handleAddMaterial}
              disabled={!selectedMaterialId || addServiceMaterial.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
          </div>
        )}

        {availableMaterials.length === 0 && materials.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Todos los materiales ya están asignados a este servicio.
          </p>
        )}

        {materials.length === 0 && (
          <div className="rounded-lg border border-dashed bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              No hay materiales creados.{" "}
              <Link href="/settings/materials" className="text-primary underline">
                Crear materiales primero
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
