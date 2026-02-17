"use client"

import { useState } from "react"
import { Building2, Search, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface AFIPSettingsProps {
  settings: Record<string, string>
  onSave: (key: string, value: string) => Promise<void>
  saving: string | null
}

const condicionIvaOptions = [
  { value: "responsable_inscripto", label: "Responsable Inscripto" },
  { value: "monotributo", label: "Monotributo" },
  { value: "exento", label: "Exento" },
  { value: "consumidor_final", label: "Consumidor Final" },
]

export function AFIPSettings({ settings, onSave, saving }: AFIPSettingsProps) {
  const [cuitLooking, setCuitLooking] = useState(false)
  const [cuitVerified, setCuitVerified] = useState(false)
  const [cuitLocal, setCuitLocal] = useState(settings["afip.cuit"] || "")

  const handleCuitLookup = async () => {
    if (!cuitLocal) {
      toast.error("Ingresa un CUIT primero")
      return
    }

    const cleaned = cuitLocal.replace(/[-\s]/g, "")
    if (cleaned.length !== 11) {
      toast.error("El CUIT debe tener 11 digitos")
      return
    }

    // Save the CUIT value first
    await onSave("afip.cuit", cuitLocal)

    setCuitLooking(true)
    try {
      const res = await fetch(`/api/afip/cuit-lookup?cuit=${cleaned}`)
      const data = await res.json()

      if (data.Contribuyente) {
        const contrib = data.Contribuyente
        // Auto-fill fields from AFIP data
        if (contrib.nombre) {
          await onSave("afip.razon_social", contrib.nombre)
        }
        if (contrib.domicilioFiscal?.direccion) {
          const domicilio = [
            contrib.domicilioFiscal.direccion,
            contrib.domicilioFiscal.localidad,
            contrib.domicilioFiscal.descripcionProvincia,
          ].filter(Boolean).join(", ")
          await onSave("afip.domicilio_fiscal", domicilio)
        }
        setCuitVerified(true)
        toast.success("Datos de AFIP obtenidos correctamente")
      } else {
        toast.error(data.errorMessage || "No se encontro el contribuyente")
      }
    } catch {
      toast.error("Error al consultar AFIP")
    } finally {
      setCuitLooking(false)
    }
  }

  const handleCuitBlur = () => {
    if (cuitLocal !== (settings["afip.cuit"] || "")) {
      onSave("afip.cuit", cuitLocal)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-indigo-500" />
        <h2 className="text-lg font-semibold">Datos Fiscales (AFIP)</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Configuracion de datos fiscales para la emision de comprobantes. Estos datos apareceran en las facturas generadas.
      </p>

      <div className="space-y-4 rounded-lg border bg-background p-4">
        {/* CUIT with lookup */}
        <div>
          <label className="text-sm font-medium">CUIT</label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">
            Ingresa el CUIT y verifica contra AFIP para autocompletar los datos
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="XX-XXXXXXXX-X"
              value={cuitLocal}
              onChange={(e) => {
                setCuitVerified(false)
                setCuitLocal(e.target.value)
              }}
              onBlur={handleCuitBlur}
              className="max-w-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCuitLookup}
              disabled={cuitLooking}
            >
              {cuitLooking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : cuitVerified ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-1.5">Verificar</span>
            </Button>
          </div>
        </div>

        {/* Razon Social */}
        <div>
          <label className="text-sm font-medium">Razon Social</label>
          <div className="flex gap-2 mt-1.5">
            <Input
              placeholder="Mi Empresa S.R.L."
              value={settings["afip.razon_social"] || ""}
              onChange={(e) => onSave("afip.razon_social", e.target.value)}
              className="max-w-sm"
            />
            <Button
              size="sm"
              onClick={() => onSave("afip.razon_social", settings["afip.razon_social"] || "")}
              disabled={saving === "afip.razon_social"}
            >
              {saving === "afip.razon_social" ? "..." : "Guardar"}
            </Button>
          </div>
        </div>

        {/* Domicilio Fiscal */}
        <div>
          <label className="text-sm font-medium">Domicilio Fiscal</label>
          <div className="flex gap-2 mt-1.5">
            <Input
              placeholder="Av. Siempreviva 742, Springfield"
              value={settings["afip.domicilio_fiscal"] || ""}
              onChange={(e) => onSave("afip.domicilio_fiscal", e.target.value)}
              className="max-w-sm"
            />
            <Button
              size="sm"
              onClick={() => onSave("afip.domicilio_fiscal", settings["afip.domicilio_fiscal"] || "")}
              disabled={saving === "afip.domicilio_fiscal"}
            >
              {saving === "afip.domicilio_fiscal" ? "..." : "Guardar"}
            </Button>
          </div>
        </div>

        {/* Condicion IVA */}
        <div>
          <label className="text-sm font-medium">Condicion frente al IVA</label>
          <div className="flex gap-2 mt-1.5">
            <Select
              value={settings["afip.condicion_iva"] || ""}
              onValueChange={(val) => onSave("afip.condicion_iva", val)}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Seleccionar condicion" />
              </SelectTrigger>
              <SelectContent>
                {condicionIvaOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Punto de Venta */}
        <div>
          <label className="text-sm font-medium">Punto de Venta</label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">
            Numero de punto de venta para la numeracion de comprobantes (5 digitos)
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="00001"
              value={settings["afip.punto_venta"] || "00001"}
              onChange={(e) => onSave("afip.punto_venta", e.target.value)}
              className="max-w-[120px]"
              maxLength={5}
            />
            <Button
              size="sm"
              onClick={() => onSave("afip.punto_venta", settings["afip.punto_venta"] || "00001")}
              disabled={saving === "afip.punto_venta"}
            >
              {saving === "afip.punto_venta" ? "..." : "Guardar"}
            </Button>
          </div>
        </div>

        {/* Inicio de Actividades */}
        <div>
          <label className="text-sm font-medium">Inicio de Actividades</label>
          <div className="flex gap-2 mt-1.5">
            <Input
              type="date"
              value={settings["afip.inicio_actividades"] || ""}
              onChange={(e) => onSave("afip.inicio_actividades", e.target.value)}
              className="max-w-xs"
            />
            <Button
              size="sm"
              onClick={() => onSave("afip.inicio_actividades", settings["afip.inicio_actividades"] || "")}
              disabled={saving === "afip.inicio_actividades"}
            >
              {saving === "afip.inicio_actividades" ? "..." : "Guardar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
