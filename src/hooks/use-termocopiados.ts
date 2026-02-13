import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Order, Client, TermocopiadoMetadata } from "@/lib/db/schema"
import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout"

export interface TermocopiadoEntry extends Order {
  client: Pick<Client, "id" | "name" | "phone" | "email" | "cuit" | "address"> | null
}

export interface TermocopiadosResponse {
  entries: TermocopiadoEntry[]
  summary: {
    todayCount: number
    todayTotal: string
  }
}

async function fetchTermocopiados(limit = 50, offset = 0): Promise<TermocopiadosResponse> {
  const res = await fetchWithTimeout(
    `/api/termocopiados?limit=${limit}&offset=${offset}`,
    { timeout: 15000 }
  )
  if (!res.ok) throw new Error("Error al obtener termocopiados")
  return res.json()
}

async function createTermocopiado(data: {
  clientId: string
  libros: number
  copias: number
  precio: string
}): Promise<Order> {
  const res = await fetchWithTimeout("/api/termocopiados", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    timeout: 15000,
  })
  if (!res.ok) throw new Error("Error al crear termocopiado")
  return res.json()
}

async function updateTermocopiado({
  id,
  data,
}: {
  id: string
  data: {
    libros?: number
    copias?: number
    precio?: string | null
    paymentStatus?: "pending" | "partial" | "paid"
  }
}): Promise<Order> {
  const res = await fetchWithTimeout(`/api/termocopiados/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    timeout: 15000,
  })
  if (!res.ok) throw new Error("Error al actualizar termocopiado")
  return res.json()
}

async function deleteTermocopiado(id: string): Promise<void> {
  const res = await fetchWithTimeout(`/api/termocopiados/${id}`, {
    method: "DELETE",
    timeout: 10000,
  })
  if (!res.ok) throw new Error("Error al eliminar termocopiado")
}

export function useTermocopiados(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ["termocopiados", limit, offset],
    queryFn: () => fetchTermocopiados(limit, offset),
    staleTime: 30 * 1000,
  })
}

export function useCreateTermocopiado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTermocopiado,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["termocopiados"] })
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}

export function useUpdateTermocopiado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTermocopiado,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["termocopiados"] })
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}

export function useDeleteTermocopiado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTermocopiado,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["termocopiados"] })
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}
