"use client"

import { useMemo } from "react"
import dayjs from "dayjs"
import { cn } from "@/lib/utils"
import { CalendarOrderPill } from "./calendar-order-pill"
import type { OrderWithClient } from "@/hooks/use-orders"

interface CalendarMonthViewProps {
  year: number
  month: number
  ordersByDate: Record<string, OrderWithClient[]>
  onOrderClick: (order: OrderWithClient) => void
}

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

export function CalendarMonthView({ year, month, ordersByDate, onOrderClick }: CalendarMonthViewProps) {
  const days = useMemo(() => {
    const firstDay = dayjs(`${year}-${String(month).padStart(2, "0")}-01`)
    const daysInMonth = firstDay.daysInMonth()

    // dayjs: 0=Sunday, 1=Monday... We want Monday=0
    let startDow = firstDay.day() - 1
    if (startDow < 0) startDow = 6 // Sunday becomes 6

    const cells: { date: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] = []

    // Previous month fill
    const prevMonth = firstDay.subtract(1, "month")
    const prevDays = prevMonth.daysInMonth()
    for (let i = startDow - 1; i >= 0; i--) {
      const d = prevDays - i
      const date = prevMonth.date(d).format("YYYY-MM-DD")
      cells.push({ date, dayNum: d, isCurrentMonth: false, isToday: false })
    }

    // Current month
    const today = dayjs().format("YYYY-MM-DD")
    for (let d = 1; d <= daysInMonth; d++) {
      const date = firstDay.date(d).format("YYYY-MM-DD")
      cells.push({ date, dayNum: d, isCurrentMonth: true, isToday: date === today })
    }

    // Next month fill (to complete the grid)
    const remaining = 7 - (cells.length % 7)
    if (remaining < 7) {
      const nextMonth = firstDay.add(1, "month")
      for (let d = 1; d <= remaining; d++) {
        const date = nextMonth.date(d).format("YYYY-MM-DD")
        cells.push({ date, dayNum: d, isCurrentMonth: false, isToday: false })
      }
    }

    return cells
  }, [year, month])

  return (
    <div>
      {/* Day names header */}
      <div className="grid grid-cols-7 gap-px bg-muted/50">
        {DAY_NAMES.map((name) => (
          <div key={name} className="py-2 text-center text-xs font-medium text-muted-foreground">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-muted/30">
        {days.map((cell) => {
          const dayOrders = ordersByDate[cell.date] || []
          return (
            <div
              key={cell.date}
              className={cn(
                "min-h-[80px] sm:min-h-[100px] bg-background p-1",
                !cell.isCurrentMonth && "opacity-40"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  cell.isToday && "bg-primary text-primary-foreground font-bold"
                )}
              >
                {cell.dayNum}
              </span>

              {/* Desktop: show pills */}
              <div className="hidden sm:flex flex-col gap-0.5 mt-0.5">
                {dayOrders.slice(0, 3).map((order) => (
                  <CalendarOrderPill
                    key={order.id}
                    order={order}
                    onClick={onOrderClick}
                  />
                ))}
                {dayOrders.length > 3 && (
                  <span className="text-xs text-muted-foreground px-1.5">
                    +{dayOrders.length - 3} más
                  </span>
                )}
              </div>

              {/* Mobile: show dots */}
              <div className="flex sm:hidden flex-wrap gap-0.5 mt-1">
                {dayOrders.slice(0, 5).map((order) => (
                  <CalendarOrderPill
                    key={order.id}
                    order={order}
                    onClick={onOrderClick}
                    compact
                  />
                ))}
                {dayOrders.length > 5 && (
                  <span className="text-[10px] text-muted-foreground">+{dayOrders.length - 5}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
