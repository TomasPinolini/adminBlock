import { useQuery } from "@tanstack/react-query"

export interface DashboardStats {
  todayOrders: number
  pendingQuotes: number
  inProgress: number
  readyForPickup: number
  overdue: number
  dueToday: number
  weekRevenue: number
  monthRevenue: number
  activeOrders: number
}

async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch("/api/stats")
  if (!res.ok) throw new Error("Error al obtener estadísticas")
  return res.json()
}

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}
