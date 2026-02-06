import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Client, NewClient } from "@/lib/db/schema"
import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout"

export interface ClientWithStats extends Client {
  orderCount: number
  totalSpent: string
  lastOrderDate: string | null
}

async function fetchClients(): Promise<ClientWithStats[]> {
  const res = await fetchWithTimeout("/api/clients", { timeout: 10000 })
  if (!res.ok) throw new Error("Error al obtener clientes")
  return res.json()
}

async function createClient(data: NewClient): Promise<Client> {
  const res = await fetchWithTimeout("/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    timeout: 15000,
  })
  if (!res.ok) throw new Error("Error al crear cliente")
  return res.json()
}

async function updateClient({
  id,
  data,
}: {
  id: string
  data: Partial<NewClient>
}): Promise<Client> {
  const res = await fetchWithTimeout(`/api/clients/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    timeout: 15000,
  })
  if (!res.ok) throw new Error("Error al actualizar cliente")
  return res.json()
}

async function deleteClient(id: string): Promise<void> {
  const res = await fetchWithTimeout(`/api/clients/${id}`, {
    method: "DELETE",
    timeout: 10000,
  })
  if (!res.ok) throw new Error("Error al eliminar cliente")
}

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
    },
  })
}

// Client stats
export interface ClientStats {
  totalClients: number
  newThisMonth: number
  topClient: { id: string; name: string; totalSpent: string } | null
  totalRevenue: number
  activeClients: number
}

async function fetchClientStats(): Promise<ClientStats> {
  const res = await fetchWithTimeout("/api/clients/stats", { timeout: 10000 })
  if (!res.ok) throw new Error("Error al obtener estadisticas")
  return res.json()
}

export function useClientStats() {
  return useQuery({
    queryKey: ["clients", "stats"],
    queryFn: fetchClientStats,
    refetchInterval: 30000,
  })
}
