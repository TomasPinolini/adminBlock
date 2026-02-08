"use client"

import { useQuery } from "@tanstack/react-query"

export interface ActivityLog {
  id: string
  activityType: string
  userId: string | null
  userEmail: string | null
  entityType: string
  entityId: string
  description: string
  metadata: string | null
  createdAt: string
}

async function fetchActivity(entityType: string, entityId: string): Promise<ActivityLog[]> {
  const params = new URLSearchParams({ entityType, entityId })
  const res = await fetch(`/api/activity?${params}`)
  if (!res.ok) throw new Error("Error al cargar historial")
  return res.json()
}

export function useActivityLogs(entityType: string, entityId: string | undefined) {
  return useQuery({
    queryKey: ["activity", entityType, entityId],
    queryFn: () => fetchActivity(entityType, entityId!),
    enabled: !!entityId,
  })
}
