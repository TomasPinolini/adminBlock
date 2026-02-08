import * as XLSX from "xlsx"
import { Order, Client } from "@/lib/db/schema"
import { formatDate } from "./dates"
import { orderStatusLabels } from "@/lib/validations/orders"

interface OrderWithClient extends Order {
  client: Client | null
}

// ---------- Helpers ----------

function autoWidth(sheet: XLSX.WorkSheet, data: Record<string, unknown>[]) {
  if (data.length === 0) return
  const maxW = 50
  sheet["!cols"] = Object.keys(data[0]).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...data.map((row) => String(row[key as keyof typeof row] ?? "").length)
    )
    return { wch: Math.min(maxLen + 2, maxW) }
  })
}

function num(v: string | number | null | undefined): number {
  if (v == null) return 0
  const n = typeof v === "string" ? parseFloat(v) : v
  return isNaN(n) ? 0 : n
}

function currency(v: number): string {
  return v.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "-"
  return new Date(d).toLocaleDateString("es-AR")
}

// ---------- Existing exports ----------

export function exportOrdersToExcel(
  orders: OrderWithClient[],
  filename = "pedidos"
) {
  const data = orders.map((order) => ({
    "Fecha": formatDate(order.createdAt),
    "Cliente": order.client?.name ?? "-",
    "Telefono": order.client?.phone ?? "-",
    "Instagram": order.client?.instagramHandle ?? "-",
    "Servicio": order.serviceType,
    "Descripcion": order.description ?? "-",
    "Estado": orderStatusLabels[order.status],
    "Precio": order.price ? `$${order.price}` : "-",
    "Fecha entrega": formatDate(order.dueDate),
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos")
  autoWidth(worksheet, data)

  XLSX.writeFile(workbook, `${filename}_${formatDate(new Date())}.xlsx`)
}

export function exportClientsToExcel(
  clients: (Client & { orderCount?: number })[],
  filename = "clientes"
) {
  const data = clients.map((client) => ({
    "Nombre": client.name,
    "Telefono": client.phone ?? "-",
    "Instagram": client.instagramHandle ?? "-",
    "Notas": client.notes ?? "-",
    "Pedidos": client.orderCount ?? 0,
    "Fecha registro": formatDate(client.createdAt),
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes")
  autoWidth(worksheet, data)

  XLSX.writeFile(workbook, `${filename}_${formatDate(new Date())}.xlsx`)
}

// ---------- Monthly Report Export ----------

export interface ReportOrder {
  id: string
  serviceType: string
  description: string | null
  price: string | null
  invoiceNumber: string | null
  invoiceType: string | null
  subtotal: string | null
  taxAmount: string | null
  createdAt: string
  clientName: string | null
  clientCuit: string | null
}

export interface ReportMaterialCost {
  id: string
  orderId: string
  lineType: string
  materialName: string | null
  supplierName: string | null
  description: string | null
  quantity: string
  unitPrice: string
  subtotal: string
}

export interface ReportExpense {
  id: string
  category: string
  description: string | null
  amount: string
}

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export function exportMonthlyReport(
  year: number,
  month: number,
  orders: ReportOrder[],
  materialCosts: ReportMaterialCost[],
  expenses: ReportExpense[],
  getServiceLabel: (name: string) => string,
) {
  const wb = XLSX.utils.book_new()
  const label = `${monthNames[month - 1]} ${year}`

  // --- Sheet: Factura A ---
  const factA = orders.filter((o) => o.invoiceType === "A")
  if (factA.length > 0) {
    const dataA = factA.map((o) => ({
      "Fecha": fmtDate(o.createdAt),
      "Factura Nro": o.invoiceNumber || "-",
      "CUIT Cliente": o.clientCuit || "-",
      "Cliente": o.clientName || "-",
      "Detalle": o.description || getServiceLabel(o.serviceType),
      "Neto Gravado": num(o.subtotal),
      "IVA 21%": num(o.taxAmount),
      "Total": num(o.price),
    }))
    dataA.push({
      "Fecha": "",
      "Factura Nro": "",
      "CUIT Cliente": "",
      "Cliente": "TOTAL FACTURA A",
      "Detalle": "",
      "Neto Gravado": factA.reduce((s, o) => s + num(o.subtotal), 0),
      "IVA 21%": factA.reduce((s, o) => s + num(o.taxAmount), 0),
      "Total": factA.reduce((s, o) => s + num(o.price), 0),
    })
    const ws = XLSX.utils.json_to_sheet(dataA)
    autoWidth(ws, dataA)
    XLSX.utils.book_append_sheet(wb, ws, "Factura A")
  }

  // --- Sheet: Factura C ---
  const factC = orders.filter((o) => o.invoiceType === "C")
  if (factC.length > 0) {
    const dataC = factC.map((o) => ({
      "Fecha": fmtDate(o.createdAt),
      "Factura Nro": o.invoiceNumber || "-",
      "CUIT Cliente": o.clientCuit || "-",
      "Cliente": o.clientName || "-",
      "Detalle": o.description || getServiceLabel(o.serviceType),
      "Total": num(o.price),
    }))
    dataC.push({
      "Fecha": "",
      "Factura Nro": "",
      "CUIT Cliente": "",
      "Cliente": "TOTAL FACTURA C",
      "Detalle": "",
      "Total": factC.reduce((s, o) => s + num(o.price), 0),
    })
    const ws = XLSX.utils.json_to_sheet(dataC)
    autoWidth(ws, dataC)
    XLSX.utils.book_append_sheet(wb, ws, "Factura C")
  }

  // --- Sheet: Sin Factura ---
  const noInv = orders.filter((o) => !o.invoiceType || o.invoiceType === "none")
  if (noInv.length > 0) {
    const dataN = noInv.map((o) => ({
      "Fecha": fmtDate(o.createdAt),
      "Cliente": o.clientName || "-",
      "Servicio": getServiceLabel(o.serviceType),
      "Detalle": o.description || "-",
      "Total": num(o.price),
    }))
    dataN.push({
      "Fecha": "",
      "Cliente": "TOTAL SIN FACTURA",
      "Servicio": "",
      "Detalle": "",
      "Total": noInv.reduce((s, o) => s + num(o.price), 0),
    })
    const ws = XLSX.utils.json_to_sheet(dataN)
    autoWidth(ws, dataN)
    XLSX.utils.book_append_sheet(wb, ws, "Sin Factura")
  }

  // --- Sheet: Gastos ---
  const gastosData: Record<string, unknown>[] = []
  if (materialCosts.length > 0) {
    materialCosts.forEach((m) => {
      gastosData.push({
        "Tipo": "Material",
        "Descripcion": m.materialName || m.description || "Material",
        "Proveedor": m.supplierName || "-",
        "Cantidad": num(m.quantity),
        "Precio Unit.": num(m.unitPrice),
        "Subtotal": num(m.subtotal),
      })
    })
    gastosData.push({
      "Tipo": "",
      "Descripcion": "SUBTOTAL MATERIALES",
      "Proveedor": "",
      "Cantidad": "",
      "Precio Unit.": "",
      "Subtotal": materialCosts.reduce((s, m) => s + num(m.subtotal), 0),
    })
  }
  if (expenses.length > 0) {
    expenses.forEach((e) => {
      gastosData.push({
        "Tipo": "Gasto",
        "Descripcion": e.category,
        "Proveedor": e.description || "-",
        "Cantidad": "",
        "Precio Unit.": "",
        "Subtotal": num(e.amount),
      })
    })
    gastosData.push({
      "Tipo": "",
      "Descripcion": "SUBTOTAL GASTOS MANUALES",
      "Proveedor": "",
      "Cantidad": "",
      "Precio Unit.": "",
      "Subtotal": expenses.reduce((s, e) => s + num(e.amount), 0),
    })
  }
  if (gastosData.length > 0) {
    const totalGastos = materialCosts.reduce((s, m) => s + num(m.subtotal), 0)
      + expenses.reduce((s, e) => s + num(e.amount), 0)
    gastosData.push({
      "Tipo": "",
      "Descripcion": "TOTAL GASTOS",
      "Proveedor": "",
      "Cantidad": "",
      "Precio Unit.": "",
      "Subtotal": totalGastos,
    })
    const ws = XLSX.utils.json_to_sheet(gastosData)
    autoWidth(ws, gastosData as Record<string, string>[])
    XLSX.utils.book_append_sheet(wb, ws, "Gastos")
  }

  // --- Sheet: Resumen ---
  const totalVentas = orders.reduce((s, o) => s + num(o.price), 0)
  const totalIVA = orders.reduce((s, o) => s + num(o.taxAmount), 0)
  const totalMat = materialCosts.reduce((s, m) => s + num(m.subtotal), 0)
  const totalExp = expenses.reduce((s, e) => s + num(e.amount), 0)
  const totalGastos = totalMat + totalExp
  const balance = totalVentas - totalGastos

  const resumen = [
    { "Concepto": `Reporte Mensual — ${label}`, "Monto": "" },
    { "Concepto": "", "Monto": "" },
    { "Concepto": "Total Ventas", "Monto": currency(totalVentas) },
    { "Concepto": `  Factura A (${factA.length})`, "Monto": currency(factA.reduce((s, o) => s + num(o.price), 0)) },
    { "Concepto": `  Factura C (${factC.length})`, "Monto": currency(factC.reduce((s, o) => s + num(o.price), 0)) },
    { "Concepto": `  Sin factura (${noInv.length})`, "Monto": currency(noInv.reduce((s, o) => s + num(o.price), 0)) },
    { "Concepto": "", "Monto": "" },
    { "Concepto": "IVA Ventas (debito fiscal)", "Monto": currency(totalIVA) },
    { "Concepto": "", "Monto": "" },
    { "Concepto": "Total Gastos", "Monto": currency(totalGastos) },
    { "Concepto": `  Materiales (${materialCosts.length})`, "Monto": currency(totalMat) },
    { "Concepto": `  Gastos manuales (${expenses.length})`, "Monto": currency(totalExp) },
    { "Concepto": "", "Monto": "" },
    { "Concepto": "BALANCE", "Monto": currency(balance) },
  ]
  const wsR = XLSX.utils.json_to_sheet(resumen)
  wsR["!cols"] = [{ wch: 35 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, wsR, "Resumen")

  XLSX.writeFile(wb, `reporte_${monthNames[month - 1].toLowerCase()}_${year}.xlsx`)
}

// ---------- Libro IVA Export ----------

export function exportLibroIVA(
  year: number,
  month: number,
  orders: ReportOrder[],
  getServiceLabel: (name: string) => string,
) {
  const wb = XLSX.utils.book_new()

  // IVA Ventas — all invoiced orders
  const invoiced = orders.filter((o) => o.invoiceType && o.invoiceType !== "none")
  const dataIVA = invoiced.map((o) => ({
    "Fecha": fmtDate(o.createdAt),
    "Tipo Comprobante": o.invoiceType === "A" ? "Factura A" : o.invoiceType === "C" ? "Factura C" : `Factura ${o.invoiceType}`,
    "Nro Comprobante": o.invoiceNumber || "-",
    "CUIT": o.clientCuit || "-",
    "Denominacion": o.clientName || "-",
    "Detalle": o.description || getServiceLabel(o.serviceType),
    "Imp. Neto Gravado": o.invoiceType === "A" ? num(o.subtotal) : num(o.price),
    "IVA 21%": o.invoiceType === "A" ? num(o.taxAmount) : 0,
    "Imp. Total": num(o.price),
  }))

  if (dataIVA.length > 0) {
    const totalNeto = dataIVA.reduce((s, r) => s + (r["Imp. Neto Gravado"] as number), 0)
    const totalIVA = dataIVA.reduce((s, r) => s + (r["IVA 21%"] as number), 0)
    const totalTotal = dataIVA.reduce((s, r) => s + (r["Imp. Total"] as number), 0)
    dataIVA.push({
      "Fecha": "",
      "Tipo Comprobante": "",
      "Nro Comprobante": "",
      "CUIT": "",
      "Denominacion": "TOTALES",
      "Detalle": "",
      "Imp. Neto Gravado": totalNeto,
      "IVA 21%": totalIVA,
      "Imp. Total": totalTotal,
    })
  }

  const ws = XLSX.utils.json_to_sheet(dataIVA.length > 0 ? dataIVA : [{ "Info": "No hay comprobantes con factura en este periodo" }])
  autoWidth(ws, dataIVA.length > 0 ? dataIVA : [])
  XLSX.utils.book_append_sheet(wb, ws, "IVA Ventas")

  XLSX.writeFile(wb, `libro_iva_ventas_${monthNames[month - 1].toLowerCase()}_${year}.xlsx`)
}

// ---------- Backup JSON ----------

export function exportBackupJSON(data: Record<string, unknown[]>) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `adminblock_backup_${formatDate(new Date()).replace(/\//g, "-")}.json`
  a.click()
  URL.revokeObjectURL(url)
}
