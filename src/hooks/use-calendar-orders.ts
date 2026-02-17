import { useOrders, type OrderWithClient } from "./use-orders"
import dayjs from "dayjs"

interface UseCalendarOrdersParams {
  year: number
  month: number // 1-12
  view: "month" | "week"
  weekStart?: string // ISO date for week view start
}

export function useCalendarOrders({ year, month, view, weekStart }: UseCalendarOrdersParams) {
  let startDate: string
  let endDate: string

  if (view === "week" && weekStart) {
    startDate = weekStart
    endDate = dayjs(weekStart).add(6, "day").format("YYYY-MM-DD")
  } else {
    // Month view: get first and last day of month
    const start = dayjs(`${year}-${String(month).padStart(2, "0")}-01`)
    startDate = start.startOf("month").format("YYYY-MM-DD")
    endDate = start.endOf("month").format("YYYY-MM-DD")
  }

  const { data: orders = [], isLoading, error } = useOrders({
    startDate,
    endDate,
  })

  // Filter out delivered and cancelled, keep only orders with dueDate
  const calendarOrders = orders.filter(
    (o) => o.dueDate && o.status !== "delivered" && o.status !== "cancelled"
  )

  // Group orders by date
  const ordersByDate = calendarOrders.reduce<Record<string, OrderWithClient[]>>((acc, order) => {
    const date = order.dueDate!
    if (!acc[date]) acc[date] = []
    acc[date].push(order)
    return acc
  }, {})

  return { ordersByDate, calendarOrders, isLoading, error }
}
