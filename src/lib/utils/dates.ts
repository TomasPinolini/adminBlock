import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import "dayjs/locale/es"

dayjs.extend(relativeTime)
dayjs.locale("es")

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-"
  return dayjs(date).format("DD/MM/YYYY")
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-"
  return dayjs(date).format("DD/MM/YYYY HH:mm")
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return "-"
  return dayjs(date).fromNow()
}

export function isOverdue(dueDate: string | Date | null | undefined): boolean {
  if (!dueDate) return false
  return dayjs(dueDate).isBefore(dayjs(), "day")
}

export function daysUntilDue(dueDate: string | Date | null | undefined): number | null {
  if (!dueDate) return null
  return dayjs(dueDate).diff(dayjs(), "day")
}
