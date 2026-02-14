import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { formatCurrency, calculateInvoiceBreakdown, formatCUIT } from "./invoice"
import { formatDate } from "./dates"
import { invoiceTypeLabels } from "@/lib/validations/orders"

// Business constants — override via env vars in .env.local:
// NEXT_PUBLIC_BUSINESS_NAME="Mi Imprenta"
// NEXT_PUBLIC_BUSINESS_ADDRESS="Ciudad, Provincia"
const BUSINESS_NAME = process.env.NEXT_PUBLIC_BUSINESS_NAME || "BLOCK Imprenta"
const BUSINESS_ADDRESS = process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "Rosario, Santa Fe"

// Helpers
function num(v: string | number | null | undefined): number {
  if (v == null) return 0
  const n = typeof v === "string" ? parseFloat(v) : v
  return isNaN(n) ? 0 : n
}

const paymentLabels: Record<string, string> = {
  pending: "Pendiente",
  partial: "Pago parcial",
  paid: "Pagado",
}

// ============================================================
// Invoice PDF
// ============================================================

export interface InvoicePDFData {
  invoiceType: "A" | "B" | "C" | "C_E"
  invoiceNumber: string | null
  createdAt: string | Date
  clientName: string
  clientCuit?: string | null
  serviceDisplayName: string
  description: string | null
  quantity: string | number | null
  price: string | number | null
  subtotal: string | number | null
  taxAmount: string | number | null
  paymentStatus: string
  paymentAmount: string | number | null
}

export function generateInvoicePDF(data: InvoicePDFData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let y = margin

  // -- Header --
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text(BUSINESS_NAME, margin, y)

  doc.setFontSize(14)
  const facturaLabel = (invoiceTypeLabels[data.invoiceType] || `Factura ${data.invoiceType}`).toUpperCase()
  doc.text(facturaLabel, pageWidth - margin, y, { align: "right" })
  y += 8

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(BUSINESS_ADDRESS, margin, y)

  const invoiceNum = data.invoiceNumber
    ? `N° 0000-${data.invoiceNumber.padStart(4, "0")}`
    : "Sin número"
  doc.text(invoiceNum, pageWidth - margin, y, { align: "right" })
  y += 6

  doc.text(`Fecha: ${formatDate(data.createdAt)}`, pageWidth - margin, y, { align: "right" })
  y += 4

  // Divider
  doc.setDrawColor(200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  // -- Client info --
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Cliente:", margin, y)
  doc.setFont("helvetica", "normal")
  doc.text(data.clientName, margin + 20, y)
  y += 6

  if (data.invoiceType === "A" && data.clientCuit) {
    doc.setFont("helvetica", "bold")
    doc.text("CUIT:", margin, y)
    doc.setFont("helvetica", "normal")
    doc.text(formatCUIT(data.clientCuit), margin + 20, y)
    y += 6
  }

  y += 4

  // -- Items table --
  const price = num(data.price)
  const breakdown = (data.subtotal && data.taxAmount)
    ? { subtotal: num(data.subtotal), taxAmount: num(data.taxAmount), total: price }
    : calculateInvoiceBreakdown(price, data.invoiceType)

  const tableHead = data.invoiceType === "A"
    ? [["Servicio", "Descripción", "Cant.", "Neto Gravado", "IVA 21%", "Total"]]
    : [["Servicio", "Descripción", "Cant.", "Total"]]

  const qty = data.quantity ? String(data.quantity) : "1"

  const tableBody = data.invoiceType === "A"
    ? [[
        data.serviceDisplayName,
        data.description || "-",
        qty,
        formatCurrency(breakdown.subtotal),
        formatCurrency(breakdown.taxAmount),
        formatCurrency(breakdown.total),
      ]]
    : [[
        data.serviceDisplayName,
        data.description || "-",
        qty,
        formatCurrency(price),
      ]]

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    theme: "grid",
    headStyles: { fillColor: [50, 50, 50], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // -- Totals --
  const totalsX = pageWidth - margin
  doc.setFontSize(10)

  if (data.invoiceType === "A") {
    doc.setFont("helvetica", "normal")
    doc.text(`Subtotal (neto gravado): ${formatCurrency(breakdown.subtotal)}`, totalsX, y, { align: "right" })
    y += 6
    doc.text(`IVA 21%: ${formatCurrency(breakdown.taxAmount)}`, totalsX, y, { align: "right" })
    y += 6
  }

  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text(`TOTAL: ${formatCurrency(breakdown.total)}`, totalsX, y, { align: "right" })
  y += 10

  // -- Payment status --
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  const statusLabel = paymentLabels[data.paymentStatus] || data.paymentStatus
  doc.text(`Estado de pago: ${statusLabel}`, margin, y)

  if (data.paymentStatus === "partial" && data.paymentAmount) {
    y += 5
    doc.text(`Monto abonado: ${formatCurrency(num(data.paymentAmount))}`, margin, y)
  }

  // -- Save --
  const typeSlug = data.invoiceType.replace(/_/g, "-").toLowerCase()
  const fileName = `factura_${typeSlug}_${data.invoiceNumber || "sin-numero"}.pdf`
  doc.save(fileName)
}

// ============================================================
// Monthly Report PDF
// ============================================================

interface ReportOrder {
  id: string
  clientName: string | null
  serviceType: string
  description: string | null
  price: string | null
  invoiceNumber: string | null
  invoiceType: string | null
  subtotal: string | null
  taxAmount: string | null
  createdAt: string
  clientCuit?: string | null
}

interface ReportMaterialCost {
  materialName: string | null
  supplierName: string | null
  description: string | null
  quantity: string
  unitPrice: string
  subtotal: string
}

interface ReportOutsourcedCost {
  supplierName: string | null
  materialsCost: string | null
  clientName: string | null
}

interface ReportExpense {
  category: string
  description: string | null
  amount: string
}

export interface MonthlyReportPDFData {
  year: number
  month: number
  orders: ReportOrder[]
  materialCosts: ReportMaterialCost[]
  outsourcedCosts: ReportOutsourcedCost[]
  expenses: ReportExpense[]
  getServiceLabel: (name: string) => string
}

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export function generateMonthlyReportPDF(data: MonthlyReportPDFData) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 12
  let y = margin

  const title = `Reporte Mensual - ${monthNames[data.month - 1]} ${data.year}`

  // -- Header --
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(BUSINESS_NAME, margin, y)
  doc.setFontSize(13)
  doc.text(title, pageWidth - margin, y, { align: "right" })
  y += 10

  // -- Summary calculations --
  const facturaAOrders = data.orders.filter((o) => o.invoiceType === "A")
  const otherInvoicedOrders = data.orders.filter((o) => o.invoiceType && o.invoiceType !== "A" && o.invoiceType !== "none")
  const noInvoiceOrders = data.orders.filter((o) => !o.invoiceType || o.invoiceType === "none")

  const totalVentas = data.orders.reduce((s, o) => s + num(o.price), 0)
  const totalIVA = data.orders.reduce((s, o) => s + num(o.taxAmount), 0)
  const totalSubtotal = data.orders.reduce((s, o) => s + num(o.subtotal), 0)
  const totalMaterial = data.materialCosts.reduce((s, m) => s + num(m.subtotal), 0)
  const totalOutsourced = data.outsourcedCosts.reduce((s, o) => s + num(o.materialsCost), 0)
  const totalManual = data.expenses.reduce((s, e) => s + num(e.amount), 0)
  const totalGastos = totalMaterial + totalOutsourced + totalManual
  const balance = totalVentas - totalGastos

  // -- Summary table --
  autoTable(doc, {
    startY: y,
    head: [["Concepto", "Monto"]],
    body: [
      ["Ventas totales", formatCurrency(totalVentas)],
      [`  Factura A (${facturaAOrders.length})`, formatCurrency(facturaAOrders.reduce((s, o) => s + num(o.price), 0))],
      [`  Otros comprobantes (${otherInvoicedOrders.length})`, formatCurrency(otherInvoicedOrders.reduce((s, o) => s + num(o.price), 0))],
      [`  Sin factura (${noInvoiceOrders.length})`, formatCurrency(noInvoiceOrders.reduce((s, o) => s + num(o.price), 0))],
      ["Subtotal neto", formatCurrency(totalSubtotal)],
      ["IVA 21%", formatCurrency(totalIVA)],
      ["", ""],
      ["Gastos totales", formatCurrency(totalGastos)],
      ["  Materiales", formatCurrency(totalMaterial)],
      ["  Tercerizados", formatCurrency(totalOutsourced)],
      ["  Gastos manuales", formatCurrency(totalManual)],
      ["", ""],
      ["BALANCE", formatCurrency(balance)],
    ],
    theme: "plain",
    headStyles: { fillColor: [50, 50, 50], textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: "right" } },
    margin: { left: margin, right: pageWidth / 2 + margin },
    didParseCell: (hookData) => {
      const text = String(hookData.cell.raw || "")
      if (text === "BALANCE") {
        hookData.cell.styles.fontStyle = "bold"
        hookData.cell.styles.fontSize = 11
      }
      if (text === "Ventas totales" || text === "Gastos totales") {
        hookData.cell.styles.fontStyle = "bold"
      }
    },
  })

  // -- Factura A detail --
  if (facturaAOrders.length > 0) {
    doc.addPage()
    y = margin

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Detalle Factura A", margin, y)
    y += 6

    autoTable(doc, {
      startY: y,
      head: [["Fecha", "Fact#", "Cliente", "CUIT", "Detalle", "Subtotal", "IVA", "Total"]],
      body: facturaAOrders.map((o) => [
        new Date(o.createdAt).toLocaleDateString("es-AR"),
        o.invoiceNumber || "-",
        o.clientName || "-",
        o.clientCuit ? formatCUIT(o.clientCuit) : "-",
        o.description || data.getServiceLabel(o.serviceType),
        formatCurrency(num(o.subtotal)),
        formatCurrency(num(o.taxAmount)),
        formatCurrency(num(o.price)),
      ]),
      foot: [[
        "", "", "", "", "Total",
        formatCurrency(facturaAOrders.reduce((s, o) => s + num(o.subtotal), 0)),
        formatCurrency(facturaAOrders.reduce((s, o) => s + num(o.taxAmount), 0)),
        formatCurrency(facturaAOrders.reduce((s, o) => s + num(o.price), 0)),
      ]],
      theme: "grid",
      headStyles: { fillColor: [50, 50, 50], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      footStyles: { fillColor: [240, 240, 240], fontStyle: "bold", fontSize: 8 },
      margin: { left: margin, right: margin },
    })
  }

  // -- Other invoiced types detail --
  if (otherInvoicedOrders.length > 0) {
    doc.addPage()
    y = margin

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Detalle Otros Comprobantes", margin, y)
    y += 6

    autoTable(doc, {
      startY: y,
      head: [["Tipo", "Fecha", "N\u00B0", "Cliente", "Detalle", "Total"]],
      body: otherInvoicedOrders.map((o) => [
        invoiceTypeLabels[o.invoiceType as keyof typeof invoiceTypeLabels] || o.invoiceType || "-",
        new Date(o.createdAt).toLocaleDateString("es-AR"),
        o.invoiceNumber || "-",
        o.clientName || "-",
        o.description || data.getServiceLabel(o.serviceType),
        formatCurrency(num(o.price)),
      ]),
      foot: [[
        "", "", "", "", "Total",
        formatCurrency(otherInvoicedOrders.reduce((s, o) => s + num(o.price), 0)),
      ]],
      theme: "grid",
      headStyles: { fillColor: [50, 50, 50], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      footStyles: { fillColor: [240, 240, 240], fontStyle: "bold", fontSize: 8 },
      margin: { left: margin, right: margin },
    })
  }

  // -- Sin factura detail --
  if (noInvoiceOrders.length > 0) {
    doc.addPage()
    y = margin

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Detalle Sin Factura", margin, y)
    y += 6

    autoTable(doc, {
      startY: y,
      head: [["Fecha", "Cliente", "Servicio", "Detalle", "Total"]],
      body: noInvoiceOrders.map((o) => [
        new Date(o.createdAt).toLocaleDateString("es-AR"),
        o.clientName || "-",
        data.getServiceLabel(o.serviceType),
        o.description || "-",
        formatCurrency(num(o.price)),
      ]),
      foot: [[
        "", "", "", "Total",
        formatCurrency(noInvoiceOrders.reduce((s, o) => s + num(o.price), 0)),
      ]],
      theme: "grid",
      headStyles: { fillColor: [50, 50, 50], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      footStyles: { fillColor: [240, 240, 240], fontStyle: "bold", fontSize: 8 },
      margin: { left: margin, right: margin },
    })
  }

  // -- Gastos detail --
  if (data.materialCosts.length > 0 || data.outsourcedCosts.length > 0 || data.expenses.length > 0) {
    doc.addPage()
    y = margin

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Detalle de Gastos", margin, y)
    y += 6

    const gastoRows: string[][] = []

    // Material costs
    for (const m of data.materialCosts) {
      gastoRows.push([
        "Material",
        m.materialName || m.description || "Material",
        m.supplierName || "-",
        m.quantity,
        formatCurrency(num(m.unitPrice)),
        formatCurrency(num(m.subtotal)),
      ])
    }

    // Outsourced costs
    for (const o of data.outsourcedCosts) {
      gastoRows.push([
        "Tercerizado",
        o.supplierName || "Proveedor",
        o.clientName || "-",
        "-",
        "-",
        formatCurrency(num(o.materialsCost)),
      ])
    }

    // Manual expenses
    for (const e of data.expenses) {
      gastoRows.push([
        "Manual",
        e.category,
        e.description || "-",
        "-",
        "-",
        formatCurrency(num(e.amount)),
      ])
    }

    autoTable(doc, {
      startY: y,
      head: [["Tipo", "Concepto", "Detalle", "Cant.", "P/U", "Subtotal"]],
      body: gastoRows,
      foot: [["", "", "", "", "Total Gastos", formatCurrency(totalGastos)]],
      theme: "grid",
      headStyles: { fillColor: [50, 50, 50], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      footStyles: { fillColor: [240, 240, 240], fontStyle: "bold", fontSize: 8 },
      margin: { left: margin, right: margin },
    })
  }

  // -- Save --
  const fileName = `reporte_${data.year}_${String(data.month).padStart(2, "0")}.pdf`
  doc.save(fileName)
}
