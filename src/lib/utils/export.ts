import * as XLSX from "xlsx"
import { Order, Client } from "@/lib/db/schema"
import { formatDate } from "./dates"
import { serviceTypeLabels, orderStatusLabels } from "@/lib/validations/orders"

interface OrderWithClient extends Order {
  client: Client | null
}

export function exportOrdersToExcel(
  orders: OrderWithClient[],
  filename = "pedidos"
) {
  const data = orders.map((order) => ({
    "Fecha": formatDate(order.createdAt),
    "Cliente": order.client?.name ?? "-",
    "Telefono": order.client?.phone ?? "-",
    "Instagram": order.client?.instagramHandle ?? "-",
    "Servicio": serviceTypeLabels[order.serviceType],
    "Descripcion": order.description ?? "-",
    "Estado": orderStatusLabels[order.status],
    "Precio": order.price ? `$${order.price}` : "-",
    "Fecha entrega": formatDate(order.dueDate),
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos")

  // Auto-width columns
  const maxWidth = 50
  const colWidths = Object.keys(data[0] || {}).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...data.map((row) => String(row[key as keyof typeof row] ?? "").length)
    )
    return { wch: Math.min(maxLen + 2, maxWidth) }
  })
  worksheet["!cols"] = colWidths

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

  XLSX.writeFile(workbook, `${filename}_${formatDate(new Date())}.xlsx`)
}
