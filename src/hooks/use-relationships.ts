import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { ClientRelationship, Client } from "@/lib/db/schema"

export interface RelationshipWithPerson extends ClientRelationship {
  person: Pick<Client, "id" | "name" | "phone" | "instagramHandle"> | null
}

export interface RelationshipWithCompany extends ClientRelationship {
  company: Pick<Client, "id" | "name" | "phone" | "instagramHandle"> | null
}

async function fetchCompanyEmployees(companyId: string): Promise<RelationshipWithPerson[]> {
  const res = await fetch(`/api/relationships?companyId=${companyId}`)
  if (!res.ok) throw new Error("Error al obtener empleados")
  return res.json()
}

async function fetchPersonEmployments(personId: string): Promise<RelationshipWithCompany[]> {
  const res = await fetch(`/api/relationships?personId=${personId}`)
  if (!res.ok) throw new Error("Error al obtener empleos")
  return res.json()
}

async function createRelationship(data: {
  personId: string
  companyId: string
  role?: string
  notes?: string
}): Promise<ClientRelationship> {
  const res = await fetch("/api/relationships", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error al crear relación")
  }
  return res.json()
}

async function updateRelationship({
  id,
  data,
}: {
  id: string
  data: { role?: string; notes?: string }
}): Promise<ClientRelationship> {
  const res = await fetch(`/api/relationships/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Error al actualizar relación")
  return res.json()
}

async function deleteRelationship(id: string): Promise<void> {
  const res = await fetch(`/api/relationships/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Error al eliminar relación")
}

// Get all employees (individuals) linked to a company
export function useCompanyEmployees(companyId: string | null) {
  return useQuery({
    queryKey: ["relationships", "company", companyId],
    queryFn: () => fetchCompanyEmployees(companyId!),
    enabled: !!companyId,
  })
}

// Get all companies an individual is linked to
export function usePersonEmployments(personId: string | null) {
  return useQuery({
    queryKey: ["relationships", "person", personId],
    queryFn: () => fetchPersonEmployments(personId!),
    enabled: !!personId,
  })
}

export function useCreateRelationship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createRelationship,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["relationships", "company", data.companyId] })
      queryClient.invalidateQueries({ queryKey: ["relationships", "person", data.personId] })
    },
  })
}

export function useUpdateRelationship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateRelationship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relationships"] })
    },
  })
}

export function useDeleteRelationship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteRelationship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["relationships"] })
    },
  })
}
