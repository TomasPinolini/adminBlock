import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Service, NewService } from "@/lib/db/schema"
import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout"

export function useServices() {
  return useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await fetchWithTimeout("/api/services", { timeout: 10000 })
      if (!res.ok) throw new Error("Error al obtener servicios")
      return res.json()
    },
  })
}

export function useService(id: string) {
  return useQuery<Service>({
    queryKey: ["services", id],
    queryFn: async () => {
      const res = await fetchWithTimeout(`/api/services/${id}`, { timeout: 10000 })
      if (!res.ok) throw new Error("Error al obtener servicio")
      return res.json()
    },
    enabled: !!id,
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<NewService, "id" | "createdAt" | "updatedAt" | "isActive">) => {
      const res = await fetchWithTimeout("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        timeout: 15000,
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al crear servicio")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<Service> & { id: string }) => {
      const res = await fetchWithTimeout(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        timeout: 15000,
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al actualizar servicio")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
    },
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithTimeout(`/api/services/${id}`, {
        method: "DELETE",
        timeout: 10000,
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al eliminar servicio")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
    },
  })
}
