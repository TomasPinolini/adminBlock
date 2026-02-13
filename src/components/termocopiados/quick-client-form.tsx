"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateClient } from "@/hooks/use-clients"
import { X } from "lucide-react"
import type { Client } from "@/lib/db/schema"

interface QuickClientFormProps {
  onCreated: (client: Client) => void
  onCancel: () => void
  initialName?: string
}

export function QuickClientForm({ onCreated, onCancel, initialName = "" }: QuickClientFormProps) {
  const createClient = useCreateClient()
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState("")
  const [cuit, setCuit] = useState("")
  const [address, setAddress] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Nombre requerido")
      return
    }
    setError("")
    try {
      const client = await createClient.mutateAsync({
        clientType: "company",
        name: name.trim(),
        phone: phone.trim() || undefined,
        cuit: cuit.trim() || undefined,
        address: address.trim() || undefined,
      })
      onCreated(client)
    } catch {
      setError("Error al crear cliente")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Nuevo cliente</span>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-sm">Empresa *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de empresa"
            className="h-12 text-lg"
            autoFocus
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Dirección</Label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Calle 123, Ciudad"
            className="h-12 text-lg"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Teléfono</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="11 1234-5678"
            inputMode="tel"
            className="h-12 text-lg"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">CUIT/CUIL</Label>
          <Input
            value={cuit}
            onChange={(e) => setCuit(e.target.value)}
            placeholder="20-12345678-9"
            className="h-12 text-lg"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        disabled={createClient.isPending}
        className="w-full h-12 text-base font-bold"
      >
        {createClient.isPending ? "Guardando..." : "Crear cliente"}
      </Button>
    </form>
  )
}
