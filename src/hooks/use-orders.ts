import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Order, NewOrder, Client } from "@/lib/db/schema"

export interface OrderWithClient extends Order {
  client: Pick<Client, "id" | "name" | "phone" | "instagramHandle"> | null
}

interface FetchOrdersParams {
  status?: string
  serviceType?: string
}

async function fetchOrders(params?: FetchOrdersParams): Promise<OrderWithClient[]> {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set("status", params.status)
  if (params?.serviceType) searchParams.set("serviceType", params.serviceType)

  const res = await fetch(`/api/orders?${searchParams}`)
  if (!res.ok) throw new Error("Error al obtener pedidos")
  return res.json()
}

async function fetchOrder(id: string): Promise<OrderWithClient> {
  const res = await fetch(`/api/orders/${id}`)
  if (!res.ok) throw new Error("Error al obtener pedido")
  return res.json()
}

async function createOrder(data: {
  clientId: string
  serviceType: string
  description: string
  price?: string
  dueDate?: string
}): Promise<Order> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Error al crear pedido")
  return res.json()
}

async function updateOrder({
  id,
  data,
}: {
  id: string
  data: Partial<NewOrder>
}): Promise<Order> {
  const res = await fetch(`/api/orders/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Error al actualizar pedido")
  return res.json()
}

async function deleteOrder(id: string): Promise<void> {
  const res = await fetch(`/api/orders/${id}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Error al eliminar pedido")
}

async function duplicateOrder(id: string): Promise<Order> {
  const res = await fetch(`/api/orders/${id}/duplicate`, {
    method: "POST",
  })
  if (!res.ok) throw new Error("Error al duplicar pedido")
  return res.json()
}

export function useOrders(params?: FetchOrdersParams) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => fetchOrders(params),
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => fetchOrder(id),
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}

export function useUpdateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}

export function useDeleteOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}

export function useDuplicateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: duplicateOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}

// Payment
async function registerPayment({
  orderId,
  paymentAmount,
  receipt,
}: {
  orderId: string
  paymentAmount: number
  receipt?: File
}): Promise<{
  order: Order
  validation: {
    orderPrice: number
    totalPaid: number
    amountMatch: boolean
    difference: number
    status: string
  }
}> {
  const formData = new FormData()
  formData.append("paymentAmount", paymentAmount.toString())
  if (receipt) {
    formData.append("receipt", receipt)
  }

  const res = await fetch(`/api/orders/${orderId}/payment`, {
    method: "POST",
    body: formData,
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error al registrar pago")
  }
  return res.json()
}

export function useRegisterPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: registerPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}
