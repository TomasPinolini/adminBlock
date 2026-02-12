"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { toast } from "sonner"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Check,
  X,
  Trash2,
  DollarSign,
  Receipt,
  Package,
  TrendingUp,
  TrendingDown,
  Download,
  FileSpreadsheet,
  Database,
  Truck,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useServices } from "@/hooks/use-services"
import {
  useMonthlyReport,
  useMonthlyExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "@/hooks/use-monthly-report"
import type { MaterialCost, OutsourcedCost } from "@/hooks/use-monthly-report"
import { cn } from "@/lib/utils"
import { exportMonthlyReport, exportLibroIVA, exportBackupJSON } from "@/lib/utils/export"
import { generateMonthlyReportPDF } from "@/lib/utils/pdf"
import { invoiceTypeLabels } from "@/lib/validations/orders"

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

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
  const { data: reportData, isLoading: reportLoading } = useMonthlyReport(year, month)
  const orders = reportData?.orders ?? []
  const materialCosts = reportData?.materialCosts ?? []
  const outsourcedCosts = reportData?.outsourcedCosts ?? []
  const { data: expenses = [], isLoading: expensesLoading } = useMonthlyExpenses(year, month)
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

  // New expense form
  const [newCategory, setNewCategory] = useState("")
  const [newAmount, setNewAmount] = useState("")
  const [newDescription, setNewDescription] = useState("")

  // Edit expense state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCategory, setEditCategory] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editAmount, setEditAmount] = useState("")

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
  const otherInvoicedOrders = orders.filter((o) => o.invoiceType && o.invoiceType !== "A" && o.invoiceType !== "none")
  const noInvoiceOrders = orders.filter((o) => !o.invoiceType || o.invoiceType === "none")

  const totalVentas = orders.reduce((sum, o) => sum + (parseFloat(o.price || "0") || 0), 0)
  const totalSubtotal = orders.reduce((sum, o) => sum + (parseFloat(o.subtotal || "0") || 0), 0)
  const totalIVA = orders.reduce((sum, o) => sum + (parseFloat(o.taxAmount || "0") || 0), 0)
  const totalMaterialCosts = materialCosts.reduce((sum, m) => sum + (parseFloat(m.subtotal) || 0), 0)
  const totalOutsourcedCosts = outsourcedCosts.reduce((sum, o) => sum + (parseFloat(o.materialsCost || "0") || 0), 0)
  const totalManualExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
  const totalGastos = totalManualExpenses + totalMaterialCosts + totalOutsourcedCosts
  const balance = totalVentas - totalGastos

  // Group material costs by order for display
  const materialCostsByOrder = materialCosts.reduce<Record<string, { clientName: string; items: MaterialCost[] }>>((acc, m) => {
    if (!acc[m.orderId]) {
      const order = orders.find((o) => o.id === m.orderId)
      acc[m.orderId] = { clientName: order?.clientName || "?", items: [] }
    }
    acc[m.orderId].items.push(m)
    return acc
  }, {})

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

  const startEditing = (e: { id: string; category: string; description: string | null; amount: string }) => {
    setEditingId(e.id)
    setEditCategory(e.category)
    setEditDescription(e.description || "")
    setEditAmount(e.amount)
  }

  const cancelEditing = () => setEditingId(null)

  const handleSaveExpense = async () => {
    if (!editingId || !editCategory.trim() || !editAmount.trim()) return
    try {
      await updateExpense.mutateAsync({
        id: editingId,
        category: editCategory.trim().toUpperCase(),
        description: editDescription.trim() || undefined,
        amount: editAmount,
      })
      setEditingId(null)
      toast.success("Gasto actualizado")
    } catch {
      toast.error("Error al actualizar gasto")
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

  const handleExportReport = () => {
    if (!orders.length && !expenses.length && !materialCosts.length) {
      toast.error("No hay datos para exportar")
      return
    }
    exportMonthlyReport(year, month, orders, materialCosts, expenses, getServiceLabel, outsourcedCosts)
    toast.success("Reporte exportado")
  }

  const handleExportPDF = () => {
    if (!orders.length && !expenses.length && !materialCosts.length) {
      toast.error("No hay datos para exportar")
      return
    }
    generateMonthlyReportPDF({
      year,
      month,
      orders: orders.map((o) => ({
        id: o.id,
        clientName: o.clientName,
        serviceType: o.serviceType,
        description: o.description,
        price: o.price,
        invoiceNumber: o.invoiceNumber,
        invoiceType: o.invoiceType,
        subtotal: o.subtotal,
        taxAmount: o.taxAmount,
        createdAt: o.createdAt,
        clientCuit: o.clientCuit,
      })),
      materialCosts: materialCosts.map((m) => ({
        materialName: m.materialName,
        supplierName: m.supplierName,
        description: m.description,
        quantity: m.quantity,
        unitPrice: m.unitPrice,
        subtotal: m.subtotal,
      })),
      outsourcedCosts: outsourcedCosts.map((o) => ({
        supplierName: o.supplierName,
        materialsCost: o.materialsCost,
        clientName: o.clientName,
      })),
      expenses: expenses.map((e) => ({
        category: e.category,
        description: e.description,
        amount: e.amount,
      })),
      getServiceLabel,
    })
    toast.success("PDF exportado")
  }

  const handleExportIVA = () => {
    const invoiced = orders.filter((o) => o.invoiceType && o.invoiceType !== "none")
    if (!invoiced.length) {
      toast.error("No hay comprobantes con factura en este periodo")
      return
    }
    exportLibroIVA(year, month, orders, getServiceLabel)
    toast.success("Libro IVA exportado")
  }

  const handleBackup = async () => {
    try {
      toast.info("Generando backup...")
      const res = await fetch("/api/backup")
      if (!res.ok) throw new Error("Error")
      const data = await res.json()
      exportBackupJSON(data)
      toast.success("Backup descargado")
    } catch {
      toast.error("Error al generar backup")
    }
  }

  const isLoading = reportLoading || expensesLoading

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
        <div className="flex flex-wrap items-center gap-2">
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
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={handleExportPDF} title="Exportar reporte mensual en PDF">
              <FileText className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportReport} title="Exportar reporte mensual en Excel">
              <Download className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportIVA} title="Exportar libro IVA ventas">
              <FileSpreadsheet className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Libro IVA</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleBackup} title="Backup completo de datos">
              <Database className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Backup</span>
            </Button>
          </div>
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
          <p className="text-xs text-muted-foreground">
            {totalMaterialCosts > 0 && <span className="text-orange-600">Mat: {formatCurrency(totalMaterialCosts)}</span>}
            {totalMaterialCosts > 0 && totalOutsourcedCosts > 0 && " + "}
            {totalOutsourcedCosts > 0 && <span className="text-purple-600">Terc: {formatCurrency(totalOutsourcedCosts)}</span>}
            {(totalMaterialCosts > 0 || totalOutsourcedCosts > 0) && totalManualExpenses > 0 && " + "}
            {totalManualExpenses > 0 && <span>Otros: {formatCurrency(totalManualExpenses)}</span>}
            {totalGastos === 0 && "Sin gastos"}
          </p>
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

      {/* VENTAS Section - Other invoiced types (B, C, NC_C, etc.) */}
      {otherInvoicedOrders.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold flex items-center gap-2">
            <Badge variant="outline">Otros comprobantes</Badge>
            <span className="text-sm text-muted-foreground">({otherInvoicedOrders.length})</span>
          </h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Tipo</th>
                  <th className="px-3 py-2 text-left font-medium">N°</th>
                  <th className="px-3 py-2 text-left font-medium">Fecha</th>
                  <th className="px-3 py-2 text-left font-medium">Cliente</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                  <th className="px-3 py-2 text-left font-medium hidden lg:table-cell">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {otherInvoicedOrders.map((o) => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2 text-xs">
                      {invoiceTypeLabels[o.invoiceType as keyof typeof invoiceTypeLabels] || o.invoiceType}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{o.invoiceNumber || "-"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-3 py-2 font-medium">{o.clientName || "-"}</td>
                    <td className="px-3 py-2 text-right font-semibold">{formatCurrency(o.price)}</td>
                    <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell truncate max-w-[200px]">
                      {o.description || getServiceLabel(o.serviceType)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/50 font-semibold">
                  <td colSpan={4} className="px-3 py-2">Total otros comprobantes</td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(otherInvoicedOrders.reduce((s, o) => s + (parseFloat(o.price || "0") || 0), 0))}
                  </td>
                  <td className="hidden lg:table-cell" />
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

        {/* Material costs from orders */}
        {materialCosts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-600" />
              Costo de materiales (automático desde pedidos)
            </h3>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Material</th>
                    <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">Proveedor</th>
                    <th className="px-3 py-2 text-left font-medium hidden lg:table-cell">Pedido (cliente)</th>
                    <th className="px-3 py-2 text-right font-medium hidden sm:table-cell">Cant.</th>
                    <th className="px-3 py-2 text-right font-medium hidden sm:table-cell">P/U</th>
                    <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {materialCosts.map((m) => {
                    const orderGroup = materialCostsByOrder[m.orderId]
                    return (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-2 font-medium">
                          {m.materialName || m.description || "Material"}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">
                          {m.supplierName || "-"}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell">
                          {orderGroup?.clientName || "-"}
                        </td>
                        <td className="px-3 py-2 text-right hidden sm:table-cell">{m.quantity}</td>
                        <td className="px-3 py-2 text-right hidden sm:table-cell">{formatCurrency(m.unitPrice)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-orange-600">
                          {formatCurrency(m.subtotal)}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-muted/50 font-semibold">
                    <td colSpan={5} className="px-3 py-2">Subtotal materiales</td>
                    <td className="px-3 py-2 text-right text-orange-600">
                      {formatCurrency(totalMaterialCosts)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Outsourced supplier costs */}
        {outsourcedCosts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Truck className="h-4 w-4 text-purple-600" />
              Costos de tercerizados (proveedores)
            </h3>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Proveedor</th>
                    <th className="px-3 py-2 text-left font-medium hidden sm:table-cell">Cliente</th>
                    <th className="px-3 py-2 text-right font-medium">Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {outsourcedCosts.map((o, i) => (
                    <tr key={`${o.orderId}-${i}`} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{o.supplierName || "Proveedor"}</td>
                      <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{o.clientName || "-"}</td>
                      <td className="px-3 py-2 text-right font-semibold text-purple-600">
                        {formatCurrency(o.materialsCost)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/50 font-semibold">
                    <td colSpan={2} className="px-3 py-2">Subtotal tercerizados</td>
                    <td className="px-3 py-2 text-right text-purple-600">
                      {formatCurrency(totalOutsourcedCosts)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Manual expenses list */}
        {expenses.length > 0 && (
          <div className="space-y-2">
            {materialCosts.length > 0 && (
              <h3 className="text-sm font-medium">Gastos manuales</h3>
            )}
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
                  {expenses.map((e) =>
                    editingId === e.id ? (
                      <tr key={e.id} className="border-b last:border-0 bg-muted/20">
                        <td className="px-2 py-1">
                          <Input
                            className="h-8 text-sm"
                            value={editCategory}
                            onChange={(ev) => setEditCategory(ev.target.value)}
                          />
                        </td>
                        <td className="px-2 py-1 hidden sm:table-cell">
                          <Input
                            className="h-8 text-sm"
                            value={editDescription}
                            onChange={(ev) => setEditDescription(ev.target.value)}
                            placeholder="Descripción"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            type="number"
                            step="0.01"
                            className="h-8 text-sm text-right"
                            value={editAmount}
                            onChange={(ev) => setEditAmount(ev.target.value)}
                          />
                        </td>
                        <td className="px-2 py-1">
                          <div className="flex gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-600 hover:text-green-600"
                              onClick={handleSaveExpense}
                              disabled={updateExpense.isPending}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={cancelEditing}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-2 font-medium">{e.category}</td>
                        <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{e.description || "-"}</td>
                        <td className="px-3 py-2 text-right font-semibold text-red-600">{formatCurrency(e.amount)}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => startEditing(e)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteExpense(e.id, e.category)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                  <tr className="bg-muted/50 font-semibold">
                    <td className="px-3 py-2">Subtotal gastos manuales</td>
                    <td className="hidden sm:table-cell" />
                    <td className="px-3 py-2 text-right text-red-600">{formatCurrency(totalManualExpenses)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Total gastos combined */}
        {(expenses.length > 0 || materialCosts.length > 0 || outsourcedCosts.length > 0) && (
          <div className="rounded-lg border bg-red-50 dark:bg-red-950/20 p-3 flex justify-between items-center">
            <span className="font-semibold">Total gastos del mes</span>
            <span className="text-lg font-bold text-red-600">{formatCurrency(totalGastos)}</span>
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
