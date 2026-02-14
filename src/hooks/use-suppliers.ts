import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout"
import type { Supplier, NewSupplier } from "@/lib/db/schema"

// Fetch all suppliers
export function useSuppliers() {
  return useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await fetchWithTimeout("/api/suppliers")
      if (!res.ok) throw new Error("Error al obtener proveedores")
      return res.json()
    },
    staleTime: 60 * 1000,
  })
}

// Fetch single supplier
export function useSupplier(id: string | null) {
  return useQuery<Supplier>({
    queryKey: ["suppliers", id],
    queryFn: async () => {
      const res = await fetchWithTimeout(`/api/suppliers/${id}`)
      if (!res.ok) throw new Error("Error al obtener proveedor")
      return res.json()
    },
    enabled: !!id,
  })
}

// Create supplier
export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<NewSupplier, "id" | "createdAt" | "updatedAt" | "isActive">) => {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al crear proveedor")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
    },
  })
}

// Update supplier
export function useUpdateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<Supplier> & { id: string }) => {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al actualizar proveedor")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
    },
  })
}

// Delete supplier (soft delete)
export function useDeleteSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al eliminar proveedor")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] })
    },
  })
}

// Supplier Materials types
interface SupplierMaterialWithDetails {
  id: string
  supplierId: string
  materialId: string
  currentPrice: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  material: {
    id: string
    name: string
    unit: string
  } | null
  supplier: {
    id: string
    name: string
  } | null
}

// Fetch supplier materials (by supplier or by material)
export function useSupplierMaterials(supplierId?: string, materialId?: string) {
  return useQuery<SupplierMaterialWithDetails[]>({
    queryKey: ["supplier-materials", supplierId, materialId],
    queryFn: async () => {
      let url = "/api/supplier-materials"
      if (supplierId) url += `?supplierId=${supplierId}`
      else if (materialId) url += `?materialId=${materialId}`
      const res = await fetchWithTimeout(url)
      if (!res.ok) throw new Error("Error al obtener materiales del proveedor")
      return res.json()
    },
  })
}

// Add material to supplier
export function useAddSupplierMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      supplierId: string
      materialId: string
      currentPrice?: string
      notes?: string
    }) => {
      const res = await fetch("/api/supplier-materials", {
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
      queryClient.invalidateQueries({ queryKey: ["supplier-materials"] })
    },
  })
}

// Update supplier material (price)
export function useUpdateSupplierMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string; currentPrice?: string; notes?: string }) => {
      const res = await fetch(`/api/supplier-materials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al actualizar precio")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-materials"] })
    },
  })
}

// Remove material from supplier
export function useRemoveSupplierMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/supplier-materials/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al eliminar material")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-materials"] })
    },
  })
}
