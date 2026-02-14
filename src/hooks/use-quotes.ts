import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout"

interface QuoteLineItem {
  materialId?: string
  description?: string
  supplierId?: string
  quantity: string
  unitPrice: string
}

interface CreateQuoteData {
  clientId?: string
  serviceType?: string
  description?: string
  deliveryDate?: string
  profitMargin?: string
  profitType?: "fixed" | "percentage"
  isOutsourced?: boolean
  outsourcedSupplierId?: string
  outsourcedCost?: string
  materials?: QuoteLineItem[]
}

interface QuoteListItem {
  id: string
  clientId: string | null
  serviceType: string | null
  description: string | null
  deliveryDate: string | null
  materialsCost: string | null
  profitMargin: string | null
  profitType: string | null
  totalPrice: string | null
  isOutsourced: boolean
  outsourcedSupplierId: string | null
  orderId: string | null
  createdAt: Date
  updatedAt: Date
  clientName: string | null
  supplierName: string | null
}

interface QuoteMaterialDetail {
  id: string
  lineType: string
  materialId: string | null
  description: string | null
  supplierId: string | null
  quantity: string
  unitPrice: string
  subtotal: string
  materialName: string | null
  materialUnit: string | null
  supplierName: string | null
}

interface QuoteDetail extends QuoteListItem {
  materials: QuoteMaterialDetail[]
}

// Fetch all quotes
export function useQuotes() {
  return useQuery<QuoteListItem[]>({
    queryKey: ["quotes"],
    queryFn: async () => {
      const res = await fetchWithTimeout("/api/quotes")
      if (!res.ok) throw new Error("Error al obtener cotizaciones")
      return res.json()
    },
  })
}

// Fetch single quote with materials
export function useQuote(id: string | null) {
  return useQuery<QuoteDetail>({
    queryKey: ["quotes", id],
    queryFn: async () => {
      const res = await fetchWithTimeout(`/api/quotes/${id}`)
      if (!res.ok) throw new Error("Error al obtener cotización")
      return res.json()
    },
    enabled: !!id,
  })
}

// Create quote
export function useCreateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateQuoteData) => {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al crear cotización")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] })
    },
  })
}

// Delete quote
export function useDeleteQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/quotes/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al eliminar cotización")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] })
    },
  })
}

// Create order from quote
export function useCreateOrderFromQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await fetch(`/api/quotes/${quoteId}/create-order`, {
        method: "POST",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al crear pedido")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] })
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    },
  })
}
