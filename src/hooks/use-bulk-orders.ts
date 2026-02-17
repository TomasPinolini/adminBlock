import { useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout"
import type { BulkAction } from "@/lib/validations/bulk"

async function bulkAction(data: BulkAction): Promise<{ success: boolean; count: number }> {
  const res = await fetchWithTimeout("/api/orders/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    timeout: 15000,
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error en operación masiva")
  }
  return res.json()
}

export function useBulkOrders() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: bulkAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}
