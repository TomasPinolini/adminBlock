import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

interface MonthlyOrder {
  id: string
  clientId: string
  serviceType: string
  status: string
  description: string | null
  price: string | null
  invoiceNumber: string | null
  invoiceType: string | null
  quantity: string | null
  subtotal: string | null
  taxAmount: string | null
  paymentStatus: string
  paymentAmount: string | null
  createdAt: string
  clientName: string | null
  clientPhone: string | null
  clientCuit: string | null
}

interface MonthlyExpense {
  id: string
  year: number
  month: number
  category: string
  description: string | null
  amount: string
  createdAt: string
  updatedAt: string
}

interface CreateExpenseData {
  year: number
  month: number
  category: string
  description?: string
  amount: string
}

interface UpdateExpenseData {
  category?: string
  description?: string
  amount?: string
}

export function useMonthlyOrders(year: number, month: number) {
  return useQuery<MonthlyOrder[]>({
    queryKey: ["monthly-orders", year, month],
    queryFn: async () => {
      const res = await fetch(`/api/reports/monthly?year=${year}&month=${month}`)
      if (!res.ok) throw new Error("Error al obtener pedidos del mes")
      return res.json()
    },
    enabled: !!year && !!month,
  })
}

export function useMonthlyExpenses(year: number, month: number) {
  return useQuery<MonthlyExpense[]>({
    queryKey: ["monthly-expenses", year, month],
    queryFn: async () => {
      const res = await fetch(`/api/monthly-expenses?year=${year}&month=${month}`)
      if (!res.ok) throw new Error("Error al obtener gastos")
      return res.json()
    },
    enabled: !!year && !!month,
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateExpenseData) => {
      const res = await fetch("/api/monthly-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error al crear gasto")
      }
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["monthly-expenses", variables.year, variables.month],
      })
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateExpenseData & { id: string }) => {
      const res = await fetch(`/api/monthly-expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error al actualizar gasto")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-expenses"] })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/monthly-expenses/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error al eliminar gasto")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-expenses"] })
    },
  })
}
