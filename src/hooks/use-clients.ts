import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Client, NewClient } from "@/lib/db/schema"

async function fetchClients(): Promise<Client[]> {
  const res = await fetch("/api/clients")
  if (!res.ok) throw new Error("Error al obtener clientes")
  return res.json()
}

async function createClient(data: NewClient): Promise<Client> {
  const res = await fetch("/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
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
  const res = await fetch(`/api/clients/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Error al actualizar cliente")
  return res.json()
}

async function deleteClient(id: string): Promise<void> {
  const res = await fetch(`/api/clients/${id}`, {
    method: "DELETE",
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
