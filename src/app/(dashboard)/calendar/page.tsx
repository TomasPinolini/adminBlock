"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import dayjs from "dayjs"
import "dayjs/locale/es"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCalendarOrders } from "@/hooks/use-calendar-orders"
import { CalendarMonthView } from "@/components/calendar/calendar-month-view"
import { CalendarWeekView } from "@/components/calendar/calendar-week-view"
import type { OrderWithClient } from "@/hooks/use-orders"

dayjs.locale("es")

const EditOrderModal = dynamic(() => import("@/components/orders/edit-order-modal").then(m => ({ default: m.EditOrderModal })), { ssr: false })

export default function CalendarPage() {
  const today = dayjs()
  const [year, setYear] = useState(today.year())
  const [month, setMonth] = useState(today.month() + 1) // 1-based
  const [view, setView] = useState<"month" | "week">("month")
  const [weekStart, setWeekStart] = useState(() => {
    // Start of current week (Monday)
    const dow = today.day()
    const mondayOffset = dow === 0 ? -6 : 1 - dow
    return today.add(mondayOffset, "day").format("YYYY-MM-DD")
  })
  const [editingOrder, setEditingOrder] = useState<OrderWithClient | null>(null)

  const { ordersByDate, isLoading } = useCalendarOrders({
    year,
    month,
    view,
    weekStart,
  })

  const handlePrev = () => {
    if (view === "month") {
      if (month === 1) {
        setMonth(12)
        setYear(year - 1)
      } else {
        setMonth(month - 1)
      }
    } else {
      const newStart = dayjs(weekStart).subtract(7, "day").format("YYYY-MM-DD")
      setWeekStart(newStart)
      // Update month/year to match
      const d = dayjs(newStart)
      setMonth(d.month() + 1)
      setYear(d.year())
    }
  }

  const handleNext = () => {
    if (view === "month") {
      if (month === 12) {
        setMonth(1)
        setYear(year + 1)
      } else {
        setMonth(month + 1)
      }
    } else {
      const newStart = dayjs(weekStart).add(7, "day").format("YYYY-MM-DD")
      setWeekStart(newStart)
      const d = dayjs(newStart)
      setMonth(d.month() + 1)
      setYear(d.year())
    }
  }

  const handleToday = () => {
    const now = dayjs()
    setYear(now.year())
    setMonth(now.month() + 1)
    const dow = now.day()
    const mondayOffset = dow === 0 ? -6 : 1 - dow
    setWeekStart(now.add(mondayOffset, "day").format("YYYY-MM-DD"))
  }

  const monthName = dayjs(`${year}-${String(month).padStart(2, "0")}-01`).format("MMMM YYYY")

  const weekLabel = view === "week"
    ? `${dayjs(weekStart).format("D MMM")} — ${dayjs(weekStart).add(6, "day").format("D MMM YYYY")}`
    : ""

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl lg:text-2xl font-bold">Calendario de Entregas</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-md border">
            <Button
              variant={view === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("month")}
              className="rounded-r-none"
            >
              Mes
            </Button>
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("week")}
              className="rounded-l-none"
            >
              Semana
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={handleToday}>
            Hoy
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={handlePrev}>
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <h2 className="text-lg font-semibold capitalize">
          {view === "month" ? monthName : weekLabel}
        </h2>

        <Button variant="ghost" size="icon" onClick={handleNext}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Calendar content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : view === "month" ? (
        <CalendarMonthView
          year={year}
          month={month}
          ordersByDate={ordersByDate}
          onOrderClick={setEditingOrder}
        />
      ) : (
        <CalendarWeekView
          weekStart={weekStart}
          ordersByDate={ordersByDate}
          onOrderClick={setEditingOrder}
        />
      )}

      {/* Edit modal */}
      <EditOrderModal
        order={editingOrder}
        open={!!editingOrder}
        onOpenChange={(open) => !open && setEditingOrder(null)}
      />
    </div>
  )
}
