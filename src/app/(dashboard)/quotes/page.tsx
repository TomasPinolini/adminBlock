"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { Plus, Trash2, Copy, Check, FileText, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { serviceTypes, serviceTypeLabels } from "@/lib/validations/orders"
import { useMaterials } from "@/hooks/use-materials"
import { useSuppliers, useSupplierMaterials } from "@/hooks/use-suppliers"
import { useQuotes, useCreateQuote, useDeleteQuote, useCreateOrderFromQuote } from "@/hooks/use-quotes"
import { useClients } from "@/hooks/use-clients"

interface QuoteMaterialItem {
  id: string
  materialId: string
  materialName: string
  materialUnit: string
  supplierId?: string
  supplierName?: string
  quantity: string
  unitPrice: string
  subtotal: number
}

export default function QuotesPage() {
  const { data: materials = [] } = useMaterials()
  const { data: suppliers = [] } = useSuppliers()
  const { data: clients = [] } = useClients()
  const { data: quotes = [], isLoading: quotesLoading } = useQuotes()
  const createQuote = useCreateQuote()
  const deleteQuote = useDeleteQuote()
  const createOrderFromQuote = useCreateOrderFromQuote()

  // Form state
  const [selectedMaterialId, setSelectedMaterialId] = useState("")
  const [selectedSupplierId, setSelectedSupplierId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [quoteMaterials, setQuoteMaterials] = useState<QuoteMaterialItem[]>([])
  const [profitMargin, setProfitMargin] = useState("")
  const [profitType, setProfitType] = useState<"fixed" | "percentage">("fixed")
  const [clientId, setClientId] = useState("")
  const [serviceType, setServiceType] = useState("")
  const [description, setDescription] = useState("")
  const [copied, setCopied] = useState(false)

  // Get supplier materials for price suggestion
  const { data: supplierMaterials = [] } = useSupplierMaterials(
    selectedSupplierId || undefined
  )

  // Find suggested price from supplier
  const suggestedPrice = supplierMaterials.find(
    (sm) => sm.materialId === selectedMaterialId
  )?.currentPrice

  // Calculate totals
  const materialsCost = quoteMaterials.reduce((sum, m) => sum + m.subtotal, 0)
  const profit = profitType === "percentage"
    ? materialsCost * (parseFloat(profitMargin) || 0) / 100
    : parseFloat(profitMargin) || 0
  const totalPrice = materialsCost + profit

  const handleAddMaterial = () => {
    if (!selectedMaterialId || !quantity || !unitPrice) return

    const material = materials.find((m) => m.id === selectedMaterialId)
    const supplier = suppliers.find((s) => s.id === selectedSupplierId)
    const qty = parseFloat(quantity)
    const price = parseFloat(unitPrice)

    if (!material || isNaN(qty) || isNaN(price)) return

    const newItem: QuoteMaterialItem = {
      id: crypto.randomUUID(),
      materialId: selectedMaterialId,
      materialName: material.name,
      materialUnit: material.unit,
      supplierId: selectedSupplierId || undefined,
      supplierName: supplier?.name,
      quantity,
      unitPrice,
      subtotal: qty * price,
    }

    setQuoteMaterials([...quoteMaterials, newItem])
    setSelectedMaterialId("")
    setSelectedSupplierId("")
    setQuantity("")
    setUnitPrice("")
  }

  const handleRemoveMaterial = (id: string) => {
    setQuoteMaterials(quoteMaterials.filter((m) => m.id !== id))
  }

  const handleSaveQuote = async () => {
    if (quoteMaterials.length === 0) return

    try {
      await createQuote.mutateAsync({
        clientId: clientId || undefined,
        serviceType: serviceType || undefined,
        description: description || undefined,
        profitMargin: profitMargin || "0",
        profitType,
        materials: quoteMaterials.map((m) => ({
          materialId: m.materialId,
          supplierId: m.supplierId,
          quantity: m.quantity,
          unitPrice: m.unitPrice,
        })),
      })

      // Reset form
      setQuoteMaterials([])
      setProfitMargin("")
      setClientId("")
      setServiceType("")
      setDescription("")
    } catch (error) {
      console.error("Error saving quote:", error)
    }
  }

  const handleDeleteQuote = async (id: string) => {
    if (confirm("¿Eliminar esta cotización?")) {
      await deleteQuote.mutateAsync(id)
    }
  }

  const handleCreateOrder = async (quoteId: string) => {
    try {
      await createOrderFromQuote.mutateAsync(quoteId)
      alert("Pedido creado exitosamente!")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al crear pedido"
      alert(message)
    }
  }

  const quoteText = totalPrice > 0
    ? `Hola! Tu cotización${serviceType ? ` para ${serviceTypeLabels[serviceType as keyof typeof serviceTypeLabels]}` : ""}: $${totalPrice.toLocaleString("es-AR")}`
    : ""

  const handleCopy = async () => {
    if (quoteText) {
      await navigator.clipboard.writeText(quoteText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold">Cotizador</h1>
        <p className="text-sm text-muted-foreground">
          Crea cotizaciones con materiales y proveedores
        </p>
      </div>

      {/* Quote Form */}
      <div className="rounded-lg border bg-background p-4 lg:p-6 space-y-4">
        <h2 className="font-semibold">Nueva Cotización</h2>

        {/* Optional: Client and Service */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Cliente (opcional)</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Servicio (opcional)</Label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de servicio" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((service) => (
                  <SelectItem key={service} value={service}>
                    {serviceTypeLabels[service]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Descripción (opcional)</Label>
            <Input
              placeholder="Descripción del trabajo"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Add Material */}
        <div className="space-y-2">
          <Label>Agregar Material</Label>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedMaterialId} onValueChange={(v) => {
              setSelectedMaterialId(v)
              setUnitPrice("")
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Material" />
              </SelectTrigger>
              <SelectContent>
                {materials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSupplierId} onValueChange={(v) => {
              setSelectedSupplierId(v)
              // Auto-fill price from supplier
              const sm = supplierMaterials.find((sm) => sm.materialId === selectedMaterialId)
              if (sm?.currentPrice) {
                setUnitPrice(sm.currentPrice)
              }
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Proveedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Cantidad"
              className="w-24"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />

            <Input
              type="number"
              placeholder={suggestedPrice ? `$${suggestedPrice}` : "Precio"}
              className="w-28"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
            />

            <Button onClick={handleAddMaterial} disabled={!selectedMaterialId || !quantity || !unitPrice}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Materials List */}
        {quoteMaterials.length > 0 && (
          <div className="space-y-2">
            <Label>Materiales agregados</Label>
            <div className="rounded-lg border divide-y">
              {quoteMaterials.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3">
                  <div className="flex-1">
                    <span className="font-medium">{m.materialName}</span>
                    {m.supplierName && (
                      <span className="text-sm text-muted-foreground ml-2">
                        ({m.supplierName})
                      </span>
                    )}
                    <div className="text-sm text-muted-foreground">
                      {m.quantity} {m.materialUnit} × ${parseFloat(m.unitPrice).toLocaleString("es-AR")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      ${m.subtotal.toLocaleString("es-AR")}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMaterial(m.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profit Margin */}
        {quoteMaterials.length > 0 && (
          <div className="flex flex-wrap items-end gap-4 pt-2">
            <div className="space-y-2">
              <Label>Costo materiales</Label>
              <p className="text-lg font-semibold">
                ${materialsCost.toLocaleString("es-AR")}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Ganancia</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0"
                  className="w-24"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(e.target.value)}
                />
                <Select value={profitType} onValueChange={(v: "fixed" | "percentage") => setProfitType(v)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">$</SelectItem>
                    <SelectItem value="percentage">%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Precio final</Label>
              <p className="text-2xl font-bold text-primary">
                ${totalPrice.toLocaleString("es-AR")}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        {quoteMaterials.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button onClick={handleSaveQuote} disabled={createQuote.isPending}>
              {createQuote.isPending ? "Guardando..." : "Guardar Cotización"}
            </Button>
            {quoteText && (
              <Button variant="outline" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar texto
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Quotes List */}
      <div className="space-y-4">
        <h2 className="font-semibold">Cotizaciones Guardadas</h2>

        {quotesLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted" />
            ))}
          </div>
        ) : quotes.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/50 p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No hay cotizaciones guardadas
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="flex items-center justify-between rounded-lg border bg-background p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {quote.clientName && (
                      <span className="font-medium">{quote.clientName}</span>
                    )}
                    {quote.serviceType && (
                      <span className="text-sm text-muted-foreground">
                        {serviceTypeLabels[quote.serviceType as keyof typeof serviceTypeLabels]}
                      </span>
                    )}
                    {!quote.clientName && !quote.serviceType && (
                      <span className="text-muted-foreground">Sin cliente</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Costo: ${Number(quote.materialsCost || 0).toLocaleString("es-AR")} |
                    Ganancia: ${Number(quote.profitMargin || 0).toLocaleString("es-AR")}
                    {quote.profitType === "percentage" ? "%" : ""}
                  </div>
                  <p className="text-lg font-semibold text-primary">
                    Total: ${Number(quote.totalPrice || 0).toLocaleString("es-AR")}
                  </p>
                  {quote.orderId && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      Pedido creado
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {!quote.orderId && quote.clientId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateOrder(quote.id)}
                      disabled={createOrderFromQuote.isPending}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Crear Pedido
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteQuote(quote.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
