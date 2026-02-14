import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout"
import type { Material, NewMaterial } from "@/lib/db/schema"

// Fetch all materials
export function useMaterials() {
  return useQuery<Material[]>({
    queryKey: ["materials"],
    queryFn: async () => {
      const res = await fetchWithTimeout("/api/materials")
      if (!res.ok) throw new Error("Error al obtener materiales")
      return res.json()
    },
    staleTime: 60 * 1000,
  })
}

// Fetch single material
export function useMaterial(id: string | null) {
  return useQuery<Material>({
    queryKey: ["materials", id],
    queryFn: async () => {
      const res = await fetchWithTimeout(`/api/materials/${id}`)
      if (!res.ok) throw new Error("Error al obtener material")
      return res.json()
    },
    enabled: !!id,
  })
}

// Create material
export function useCreateMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<NewMaterial, "id" | "createdAt" | "updatedAt" | "isActive">) => {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al crear material")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] })
    },
  })
}

// Update material
export function useUpdateMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<Material> & { id: string }) => {
      const res = await fetch(`/api/materials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al actualizar material")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] })
    },
  })
}

// Delete material (soft delete)
export function useDeleteMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/materials/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al eliminar material")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] })
    },
  })
}

// Service Materials types
interface ServiceMaterialWithMaterial {
  id: string
  serviceType: string
  materialId: string
  defaultQuantity: string | null
  isRequired: boolean
  createdAt: Date
  material: {
    id: string
    name: string
    unit: string
  } | null
}

// Fetch service materials (optionally by service type)
export function useServiceMaterials(serviceType?: string) {
  return useQuery<ServiceMaterialWithMaterial[]>({
    queryKey: ["service-materials", serviceType],
    queryFn: async () => {
      const url = serviceType
        ? `/api/service-materials?serviceType=${serviceType}`
        : "/api/service-materials"
      const res = await fetchWithTimeout(url)
      if (!res.ok) throw new Error("Error al obtener materiales de servicio")
      return res.json()
    },
  })
}

// Add material to service
export function useAddServiceMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      serviceType: string
      materialId: string
      defaultQuantity?: string
      isRequired?: boolean
    }) => {
      const res = await fetch("/api/service-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al agregar material")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-materials"] })
    },
  })
}

// Remove material from service
export function useRemoveServiceMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/service-materials/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al eliminar material")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-materials"] })
    },
  })
}
