"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { Download, CalendarDays, Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { exportOrdersToExcel, exportClientsToExcel } from "@/lib/utils/export"

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [loading, setLoading] = useState<string | null>(null)

  const handleExportMonthOrders = async () => {
    setLoading("month")
    try {
      const res = await fetch("/api/export/orders?period=month")
      if (!res.ok) throw new Error("Error al exportar")
      const orders = await res.json()
      if (orders.length === 0) {
        alert("No hay pedidos este mes")
        return
      }
      exportOrdersToExcel(orders, "pedidos_mes")
    } catch (error) {
      console.error(error)
      alert("Error al exportar pedidos")
    } finally {
      setLoading(null)
    }
  }

  const handleExportDateRange = async () => {
    if (!fromDate || !toDate) {
      alert("Selecciona ambas fechas")
      return
    }
    setLoading("range")
    try {
      const res = await fetch(`/api/export/orders?from=${fromDate}&to=${toDate}`)
      if (!res.ok) throw new Error("Error al exportar")
      const orders = await res.json()
      if (orders.length === 0) {
        alert("No hay pedidos en ese rango")
        return
      }
      exportOrdersToExcel(orders, `pedidos_${fromDate}_${toDate}`)
    } catch (error) {
      console.error(error)
      alert("Error al exportar pedidos")
    } finally {
      setLoading(null)
    }
  }

  const handleExportClients = async () => {
    setLoading("clients")
    try {
      const res = await fetch("/api/export/clients")
      if (!res.ok) throw new Error("Error al exportar")
      const clients = await res.json()
      if (clients.length === 0) {
        alert("No hay clientes registrados")
        return
      }
      exportClientsToExcel(clients, "clientes")
    } catch (error) {
      console.error(error)
      alert("Error al exportar clientes")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Exporta datos a Excel
        </p>
      </div>

      {/* Report options */}
      <div className="grid gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Pedidos del mes */}
        <div className="rounded-lg border bg-background p-4 lg:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Pedidos del mes</h3>
              <p className="text-xs lg:text-sm text-muted-foreground">
                Todos los pedidos del mes actual
              </p>
            </div>
          </div>
          <Button 
            className="w-full h-11 lg:h-9" 
            variant="outline"
            onClick={handleExportMonthOrders}
            disabled={loading === "month"}
          >
            {loading === "month" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {loading === "month" ? "Exportando..." : "Exportar"}
          </Button>
        </div>

        {/* Pedidos por rango */}
        <div className="rounded-lg border bg-background p-4 lg:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Por fechas</h3>
              <p className="text-xs lg:text-sm text-muted-foreground">
                Selecciona un rango
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Desde</Label>
              <Input 
                type="date" 
                className="h-11 lg:h-9" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hasta</Label>
              <Input 
                type="date" 
                className="h-11 lg:h-9"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
          <Button 
            className="w-full h-11 lg:h-9" 
            variant="outline"
            onClick={handleExportDateRange}
            disabled={loading === "range" || !fromDate || !toDate}
          >
            {loading === "range" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {loading === "range" ? "Exportando..." : "Exportar"}
          </Button>
        </div>

        {/* Lista de clientes */}
        <div className="rounded-lg border bg-background p-4 lg:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Clientes</h3>
              <p className="text-xs lg:text-sm text-muted-foreground">
                Todos los clientes registrados
              </p>
            </div>
          </div>
          <Button 
            className="w-full h-11 lg:h-9" 
            variant="outline"
            onClick={handleExportClients}
            disabled={loading === "clients"}
          >
            {loading === "clients" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {loading === "clients" ? "Exportando..." : "Exportar"}
          </Button>
        </div>
      </div>

      {/* Stats placeholder */}
      <div className="rounded-lg border bg-background p-6 lg:p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-base lg:text-lg font-medium">Estadisticas</p>
          <p className="text-sm mt-1">
            Proximamente: graficos de pedidos y clientes
          </p>
        </div>
      </div>
    </div>
  )
}
