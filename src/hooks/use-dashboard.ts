import { useQuery } from "@tanstack/react-query"
import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout"

export interface DashboardKPIs {
  monthRevenue: number
  prevMonthRevenue: number
  monthOrders: number
  prevMonthOrders: number
  monthExpenses: number
  prevMonthExpenses: number
  overdueOrders: number
  pendingQuotes: number
  activeOrders: number
}

export interface MonthlyTrend {
  month: number
  year: number
  label: string
  revenue: number
  expenses: number
  orderCount: number
}

export interface TopClient {
  clientId: string
  clientName: string
  revenue: number
  orderCount: number
}

export interface TopService {
  serviceType: string
  displayName: string
  revenue: number
  orderCount: number
}

export interface DashboardData {
  kpis: DashboardKPIs
  monthlyTrends: MonthlyTrend[]
  topClients: TopClient[]
  topServices: TopService[]
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetchWithTimeout("/api/dashboard", { timeout: 15000 })
  if (!res.ok) throw new Error("Error al obtener datos del dashboard")
  return res.json()
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  })
}
