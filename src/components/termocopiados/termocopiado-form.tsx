"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Combobox } from "@/components/ui/combobox"
import { QuickClientForm } from "./quick-client-form"
import { useClients } from "@/hooks/use-clients"
import { useCreateTermocopiado } from "@/hooks/use-termocopiados"
import { Save, Plus, Building2, Phone, MapPin, FileText } from "lucide-react"
import { toast } from "sonner"
import type { Client } from "@/lib/db/schema"

export function TermocopiadoForm() {
  const { data: clients = [] } = useClients()
  const createTermocopiado = useCreateTermocopiado()

  const [selectedClientId, setSelectedClientId] = useState("")
  const [showNewClient, setShowNewClient] = useState(false)
  const [libros, setLibros] = useState("")
  const [copias, setCopias] = useState("")
  const [precio, setPrecio] = useState("")

  const librosRef = useRef<HTMLInputElement>(null)

  const clientOptions = useMemo(
    () =>
      clients.map((c) => ({
        value: c.id,
        label: c.name + (c.cuit ? ` (${c.cuit})` : ""),
      })),
    [clients]
  )

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId]
  )

  const handleClientCreated = (client: Client) => {
    setSelectedClientId(client.id)
    setShowNewClient(false)
    // Focus libros after creating client
    setTimeout(() => librosRef.current?.focus(), 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClientId) {
      toast.error("Seleccioná un cliente")
      return
    }
    if (!libros || !Number.isFinite(parseInt(libros)) || parseInt(libros) < 1) {
      toast.error("Ingresá la cantidad de libros")
      return
    }
    if (!copias || !Number.isFinite(parseInt(copias)) || parseInt(copias) < 1) {
      toast.error("Ingresá la cantidad de copias")
      return
    }
    if (!precio || !Number.isFinite(parseFloat(precio)) || parseFloat(precio) <= 0) {
      toast.error("Ingresá el precio")
      return
    }

    try {
      await createTermocopiado.mutateAsync({
        clientId: selectedClientId,
        libros: parseInt(libros),
        copias: parseInt(copias),
        precio,
      })
      toast.success("Termocopiado guardado")
      // Clear numbers but keep client for batch entry
      setLibros("")
      setCopias("")
      setPrecio("")
      librosRef.current?.focus()
    } catch {
      toast.error("Error al guardar")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-4 sm:p-6 space-y-4">
      {/* Client selector */}
      <div className="space-y-2">
        <Label className="text-base font-medium">Cliente</Label>
        <Combobox
          options={clientOptions}
          value={selectedClientId}
          onValueChange={(val) => {
            setSelectedClientId(val)
            setShowNewClient(false)
            if (val) setTimeout(() => librosRef.current?.focus(), 100)
          }}
          placeholder="Buscar cliente..."
          searchPlaceholder="Escribí el nombre..."
          emptyText="Sin resultados"
          className="h-12 text-lg"
        />

        {!showNewClient && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowNewClient(true)
              setSelectedClientId("")
            }}
            className="text-sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Crear nuevo cliente
          </Button>
        )}
      </div>

      {/* Quick client form (inline expand) */}
      {showNewClient && (
        <QuickClientForm
          onCreated={handleClientCreated}
          onCancel={() => setShowNewClient(false)}
        />
      )}

      {/* Client info card (read-only) */}
      {selectedClient && !showNewClient && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium">{selectedClient.name}</span>
          </div>
          {selectedClient.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{selectedClient.address}</span>
            </div>
          )}
          {selectedClient.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{selectedClient.phone}</span>
            </div>
          )}
          {selectedClient.cuit && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{selectedClient.cuit}</span>
            </div>
          )}
        </div>
      )}

      {/* Number inputs row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-sm font-medium">Libros</Label>
          <Input
            ref={librosRef}
            value={libros}
            onChange={(e) => setLibros(e.target.value)}
            placeholder="0"
            inputMode="numeric"
            className="h-12 text-lg text-center font-semibold"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">Copias</Label>
          <Input
            value={copias}
            onChange={(e) => setCopias(e.target.value)}
            placeholder="0"
            inputMode="numeric"
            className="h-12 text-lg text-center font-semibold"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">Precio $</Label>
          <Input
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="0"
            inputMode="decimal"
            className="h-12 text-lg text-center font-semibold"
          />
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={createTermocopiado.isPending}
        className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white"
      >
        <Save className="h-5 w-5 mr-2" />
        {createTermocopiado.isPending ? "GUARDANDO..." : "GUARDAR"}
      </Button>
    </form>
  )
}
