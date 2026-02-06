import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Contact, NewContact } from "@/lib/db/schema"
import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout"

async function fetchContacts(clientId: string): Promise<Contact[]> {
  const res = await fetchWithTimeout(`/api/contacts?clientId=${clientId}`, { timeout: 10000 })
  if (!res.ok) throw new Error("Error al obtener contactos")
  return res.json()
}

async function createContact(data: NewContact): Promise<Contact> {
  const res = await fetchWithTimeout("/api/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    timeout: 15000,
  })
  if (!res.ok) throw new Error("Error al crear contacto")
  return res.json()
}

async function updateContact({
  id,
  data,
}: {
  id: string
  data: Partial<NewContact>
}): Promise<Contact> {
  const res = await fetchWithTimeout(`/api/contacts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    timeout: 15000,
  })
  if (!res.ok) throw new Error("Error al actualizar contacto")
  return res.json()
}

async function deleteContact(id: string): Promise<void> {
  const res = await fetchWithTimeout(`/api/contacts/${id}`, {
    method: "DELETE",
    timeout: 10000,
  })
  if (!res.ok) throw new Error("Error al eliminar contacto")
}

export function useContacts(clientId: string | null) {
  return useQuery({
    queryKey: ["contacts", clientId],
    queryFn: () => fetchContacts(clientId!),
    enabled: !!clientId,
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createContact,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contacts", data.clientId] })
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] })
    },
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] })
    },
  })
}
