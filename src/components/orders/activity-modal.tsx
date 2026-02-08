"use client"

import { useActivityLogs } from "@/hooks/use-activity"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  PlusCircle,
  Edit,
  ArrowRightLeft,
  Trash2,
  Copy,
  MessageCircle,
  CreditCard,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"

const activityIcons: Record<string, React.ElementType> = {
  order_created: PlusCircle,
  order_updated: Edit,
  order_status_changed: ArrowRightLeft,
  order_deleted: Trash2,
  order_duplicated: Copy,
  comment_added: MessageCircle,
  payment_registered: CreditCard,
}

const activityColors: Record<string, string> = {
  order_created: "text-green-600",
  order_updated: "text-blue-600",
  order_status_changed: "text-orange-600",
  order_deleted: "text-red-600",
  order_duplicated: "text-purple-600",
  comment_added: "text-cyan-600",
  payment_registered: "text-emerald-600",
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return "Ahora"
  if (diffMin < 60) return `Hace ${diffMin} min`
  if (diffHrs < 24) return `Hace ${diffHrs}h`
  if (diffDays === 1) return "Ayer"
  if (diffDays < 7) return `Hace ${diffDays} días`

  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getUserLabel(email: string | null): string {
  if (!email) return "Sistema"
  const name = email.split("@")[0]
  return name.charAt(0).toUpperCase() + name.slice(1)
}

interface ActivityModalProps {
  orderId: string | null
  orderLabel?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ActivityModal({ orderId, orderLabel, open, onOpenChange }: ActivityModalProps) {
  const { data: logs = [], isLoading } = useActivityLogs("order", orderId ?? undefined)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Historial {orderLabel ? `— ${orderLabel}` : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay actividad registrada
            </p>
          ) : (
            <div className="relative py-4">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-6 bottom-6 w-px bg-border" />

              <div className="space-y-4">
                {logs.map((log) => {
                  const Icon = activityIcons[log.activityType] || Activity
                  const color = activityColors[log.activityType] || "text-muted-foreground"

                  return (
                    <div key={log.id} className="flex gap-3 relative">
                      {/* Icon */}
                      <div className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background border z-10",
                        color
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm leading-snug">
                          <span className="font-medium">{getUserLabel(log.userEmail)}</span>
                          {" — "}
                          <span className="text-muted-foreground">{log.description}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5" title={formatDateTime(log.createdAt)}>
                          {formatTimeAgo(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
