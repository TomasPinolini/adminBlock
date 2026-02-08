"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { toast } from "sonner"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Download,
  DollarSign,
  Receipt,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useServices } from "@/hooks/use-services"
import {
  useMonthlyOrders,
  useMonthlyExpenses,
  useCreateExpense,
  useDeleteExpense,
} from "@/hooks/use-monthly-report"
import { cn } from "@/lib/utils"

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const invoiceTypeLabels: Record<string, string> = {
  A: "Factura A",
  B: "Factura B",
  C: "Factura C",
  none: "Sin factura",
}

function formatCurrency(value: string | number | null | undefined): string {
  if (!value) return "-"
  const num = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(num)) return "-"
  return `$${num.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function ReportsPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const { data: services = [] } = useServices()

  // Data
  const { data: orders = [], isLoading: ordersLoading } = useMonthlyOrders(year, month)
  const { data: expenses = [], isLoading: expensesLoading } = useMonthlyExpenses(year, month)
  const createExpense = useCreateExpense()
  const deleteExpense = useDeleteExpense()

  // New expense form
  const [newCategory, setNewCategory] = useState("")
  const [newAmount, setNewAmount] = useState("")
  const [newDescription, setNewDescription] = useState("")

  // Navigation
  const goToPrevMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }
  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  // Calculations
  const invoicedOrders = orders.filter((o) => o.invoiceType && o.invoiceType !== "none")
  const facturaAOrders = orders.filter((o) => o.invoiceType === "A")
  const facturaCOrders = orders.filter((o) => o.invoiceType === "C")
  const noInvoiceOrders = orders.filter((o) => !o.invoiceType || o.invoiceType === "none")

  const totalVentas = orders.reduce((sum, o) => sum + (parseFloat(o.price || "0") || 0), 0)
  const totalSubtotal = orders.reduce((sum, o) => sum + (parseFloat(o.subtotal || "0") || 0), 0)
  const totalIVA = orders.reduce((sum, o) => sum + (parseFloat(o.taxAmount || "0") || 0), 0)
  const totalGastos = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
  const balance = totalVentas - totalGastos

  const getServiceLabel = (name: string) => {
    const svc = services.find((s) => s.name === name)
    return svc?.displayName || name
  }

  const handleAddExpense = async () => {
    if (!newCategory.trim() || !newAmount.trim()) return
    try {
      await createExpense.mutateAsync({
        year,
        month,
        category: newCategory.trim().toUpperCase(),
        description: newDescription.trim() || undefined,
        amount: newAmount,
      })
      setNewCategory("")
      setNewAmount("")
      setNewDescription("")
      toast.success("Gasto agregado")
    } catch (error) {
      toast.error("Error al agregar gasto")
    }
  }

  const handleDeleteExpense = async (id: string, category: string) => {
    const confirmed = await confirm({
      title: "Eliminar gasto",
      description: `¿Eliminar "${category}"?`,
      confirmText: "Eliminar",
      variant: "destructive",
    })
    if (confirmed) {
      try {
        await deleteExpense.mutateAsync(id)
        toast.success("Gasto eliminado")
      } catch {
        toast.error("Error al eliminar gasto")
      }
    }
  }

  const isLoading = ordersLoading || expensesLoading

  return (
    <div className="space-y-4 lg:space-y-6">
      <ConfirmDialog />

      {/* Header + Month Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">Reportes</h1>
          <p className="text-sm text-muted-foreground">
            Libro mensual de ventas y gastos
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-background p-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[160px] text-center font-semibold text-sm">
            {monthNames[month - 1]} {year}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-background p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-green-600" />
            Ventas
          </div>
          <p className="mt-1 text-lg font-bold text-green-600">{formatCurrency(totalVentas)}</p>
          <p className="text-xs text-muted-foreground">{orders.length} pedidos</p>
        </div>
        <div className="rounded-lg border bg-background p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingDown className="h-4 w-4 text-red-600" />
            Gastos
          </div>
          <p className="mt-1 text-lg font-bold text-red-600">{formatCurrency(totalGastos)}</p>
          <p className="text-xs text-muted-foreground">{expenses.length} gastos</p>
        </div>
        <div className="rounded-lg border bg-background p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4 text-blue-600" />
            Balance
          </div>
          <p className={cn("mt-1 text-lg font-bold", balance >= 0 ? "text-green-600" : "text-red-600")}>
            {formatCurrency(balance)}
          </p>
        </div>
        <div className="rounded-lg border bg-background p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Receipt className="h-4 w-4 text-purple-600" />
            IVA
          </div>
          <p className="mt-1 text-lg font-bold text-purple-600">{formatCurrency(totalIVA)}</p>
          <p className="text-xs text-muted-foreground">Subtotal: {formatCurrency(totalSubtotal)}</p>
        </div>
      </div>

      {/* VENTAS Section - Factura A */}
      {facturaAOrders.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold flex items-center gap-2">
            <Badge variant="outline">Factura A</Badge>
            <span className="text-sm text-muted-foreground">({facturaAOrders.length})</span>
          </h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Fact#</th>
                  <th className="px-3 py-2 text-left font-medium">Fecha</th>
                  <th className="px-3 py-2 text-left font-medium">Cliente</th>
                  <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                  <th className="px-3 py-2 text-right font-medium">IVA</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                  <th className="px-3 py-2 text-left font-medium hidden lg:table-cell">CUIT</th>
                  <th className="px-3 py-2 text-left font-medium hidden lg:table-cell">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {facturaAOrders.map((o) => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono text-xs">{o.invoiceNumber || "-"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-3 py-2 font-medium">{o.clientName || "-"}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(o.subtotal)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(o.taxAmount)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{formatCurrency(o.price)}</td>
                    <td className="px-3 py-2 font-mono text-xs hidden lg:table-cell">{o.clientCuit || "-"}</td>
                    <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell truncate max-w-[200px]">
                      {o.description || getServiceLabel(o.serviceType)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-semibold">
                  <td colSpan={3} className="px-3 py-2">Total Factura A</td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(facturaAOrders.reduce((s, o) => s + (parseFloat(o.subtotal || "0") || 0), 0))}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(facturaAOrders.reduce((s, o) => s + (parseFloat(o.taxAmount || "0") || 0), 0))}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(facturaAOrders.reduce((s, o) => s + (parseFloat(o.price || "0") || 0), 0))}
                  </td>
                  <td colSpan={2} className="hidden lg:table-cell" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VENTAS Section - Factura C */}
      {facturaCOrders.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold flex items-center gap-2">
            <Badge variant="outline">Factura C</Badge>
            <span className="text-sm text-muted-foreground">({facturaCOrders.length})</span>
          </h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Fact#</th>
                  <th className="px-3 py-2 text-left font-medium">Fecha</th>
                  <th className="px-3 py-2 text-left font-medium">Cliente</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                  <th className="px-3 py-2 text-left font-medium hidden lg:table-cell">CUIT</th>
                  <th className="px-3 py-2 text-left font-medium hidden lg:table-cell">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {facturaCOrders.map((o) => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono text-xs">{o.invoiceNumber || "-"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-3 py-2 font-medium">{o.clientName || "-"}</td>
                    <td className="px-3 py-2 text-right font-semibold">{formatCurrency(o.price)}</td>
                    <td className="px-3 py-2 font-mono text-xs hidden lg:table-cell">{o.clientCuit || "-"}</td>
                    <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell truncate max-w-[200px]">
                      {o.description || getServiceLabel(o.serviceType)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-semibold">
                  <td colSpan={3} className="px-3 py-2">Total Factura C</td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(facturaCOrders.reduce((s, o) => s + (parseFloat(o.price || "0") || 0), 0))}
                  </td>
                  <td colSpan={2} className="hidden lg:table-cell" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VENTAS Section - Sin factura */}
      {noInvoiceOrders.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold flex items-center gap-2">
            <Badge variant="secondary">Sin factura</Badge>
            <span className="text-sm text-muted-foreground">({noInvoiceOrders.length})</span>
          </h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Fecha</th>
                  <th className="px-3 py-2 text-left font-medium">Cliente</th>
                  <th className="px-3 py-2 text-left font-medium">Servicio</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                  <th className="px-3 py-2 text-left font-medium hidden lg:table-cell">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {noInvoiceOrders.map((o) => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-3 py-2 font-medium">{o.clientName || "-"}</td>
                    <td className="px-3 py-2">{getServiceLabel(o.serviceType)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{formatCurrency(o.price)}</td>
                    <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell truncate max-w-[200px]">
                      {o.description || "-"}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-semibold">
                  <td colSpan={3} className="px-3 py-2">Total sin factura</td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(noInvoiceOrders.reduce((s, o) => s + (parseFloat(o.price || "0") || 0), 0))}
                  </td>
                  <td className="hidden lg:table-cell" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state for orders */}
      {!isLoading && orders.length === 0 && (
        <div className="rounded-lg border border-dashed bg-muted/50 p-8 text-center">
          <Receipt className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-2 font-medium">No hay pedidos en {monthNames[month - 1]} {year}</p>
          <p className="text-sm text-muted-foreground">Los pedidos creados en este mes aparecerán acá</p>
        </div>
      )}

      {/* GASTOS Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-red-600" />
          Gastos de {monthNames[month - 1]}
        </h2>

        {/* Expenses list */}
        {expenses.length > 0 && (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Categoría</th>
                  <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">Descripción</th>
                  <th className="px-3 py-2 text-right font-medium">Monto</th>
                  <th className="px-3 py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium">{e.category}</td>
                    <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{e.description || "-"}</td>
                    <td className="px-3 py-2 text-right font-semibold text-red-600">{formatCurrency(e.amount)}</td>
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteExpense(e.id, e.category)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-semibold">
                  <td className="px-3 py-2">Total Gastos</td>
                  <td className="hidden sm:table-cell" />
                  <td className="px-3 py-2 text-right text-red-600">{formatCurrency(totalGastos)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Add expense form */}
        <div className="rounded-lg border bg-background p-3">
          <p className="text-sm font-medium mb-2">Agregar gasto</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Categoría (ej: ALQUILER)"
              className="h-9 sm:flex-1"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <Input
              placeholder="Descripción (opc.)"
              className="h-9 sm:flex-1 hidden sm:block"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Monto"
              className="h-9 w-full sm:w-32"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
            />
            <Button
              size="sm"
              className="h-9"
              onClick={handleAddExpense}
              disabled={!newCategory.trim() || !newAmount.trim() || createExpense.isPending}
            >
              <Plus className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Agregar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      )}
    </div>
  )
}
