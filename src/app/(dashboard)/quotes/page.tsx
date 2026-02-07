"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { toast } from "sonner"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { Plus, Trash2, Copy, Check, FileText, ShoppingCart, Wrench, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { logApiError } from "@/lib/logger"

interface QuoteLineItem {
  id: string
  lineType: "material" | "service"
  materialId?: string
  materialName?: string
  materialUnit?: string
  description?: string
  supplierId?: string
  supplierName?: string
  quantity: string
  unitPrice: string
  subtotal: number
}

export default function QuotesPage() {
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const { data: materials = [] } = useMaterials()
  const { data: suppliers = [] } = useSuppliers()
  const { data: clients = [] } = useClients()
  const { data: quotes = [], isLoading: quotesLoading } = useQuotes()
  const createQuote = useCreateQuote()
  const deleteQuote = useDeleteQuote()
  const createOrderFromQuote = useCreateOrderFromQuote()

  // Form state
  const [isOutsourced, setIsOutsourced] = useState(false)
  const [outsourcedSupplierId, setOutsourcedSupplierId] = useState("")
  const [outsourcedCost, setOutsourcedCost] = useState("")
  const [lineType, setLineType] = useState<"material" | "service">("material")
  const [selectedMaterialId, setSelectedMaterialId] = useState("")
  const [selectedSupplierId, setSelectedSupplierId] = useState("")
  const [lineDescription, setLineDescription] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [quoteLines, setQuoteLines] = useState<QuoteLineItem[]>([])
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
  const baseCost = isOutsourced
    ? parseFloat(outsourcedCost) || 0
    : quoteLines.reduce((sum, m) => sum + m.subtotal, 0)
  const profit = profitType === "percentage"
    ? baseCost * (parseFloat(profitMargin) || 0) / 100
    : parseFloat(profitMargin) || 0
  const totalPrice = baseCost + profit

  const handleAddLine = () => {
    if (lineType === "material") {
      if (!selectedMaterialId || !quantity || !unitPrice) return
      const material = materials.find((m) => m.id === selectedMaterialId)
      const supplier = suppliers.find((s) => s.id === selectedSupplierId)
      const qty = parseFloat(quantity)
      const price = parseFloat(unitPrice)
      if (!material || isNaN(qty) || isNaN(price)) return

      const newItem: QuoteLineItem = {
        id: crypto.randomUUID(),
        lineType: "material",
        materialId: selectedMaterialId,
        materialName: material.name,
        materialUnit: material.unit,
        supplierId: selectedSupplierId || undefined,
        supplierName: supplier?.name,
        quantity,
        unitPrice,
        subtotal: qty * price,
      }
      setQuoteLines([...quoteLines, newItem])
      setSelectedMaterialId("")
      setSelectedSupplierId("")
      setQuantity("")
      setUnitPrice("")
    } else {
      // Service line
      if (!lineDescription || !unitPrice) return
      const supplier = suppliers.find((s) => s.id === selectedSupplierId)
      const qty = parseFloat(quantity) || 1
      const price = parseFloat(unitPrice)
      if (isNaN(price)) return

      const newItem: QuoteLineItem = {
        id: crypto.randomUUID(),
        lineType: "service",
        description: lineDescription,
        supplierId: selectedSupplierId || undefined,
        supplierName: supplier?.name,
        quantity: String(qty),
        unitPrice,
        subtotal: qty * price,
      }
      setQuoteLines([...quoteLines, newItem])
      setLineDescription("")
      setSelectedSupplierId("")
      setQuantity("")
      setUnitPrice("")
    }
  }

  const handleRemoveLine = (id: string) => {
    setQuoteLines(quoteLines.filter((m) => m.id !== id))
  }

  const handleSaveQuote = async () => {
    if (!isOutsourced && quoteLines.length === 0) return
    if (isOutsourced && (!outsourcedSupplierId || !outsourcedCost)) return

    try {
      await createQuote.mutateAsync({
        clientId: clientId || undefined,
        serviceType: serviceType || undefined,
        description: description || undefined,
        profitMargin: profitMargin || "0",
        profitType,
        isOutsourced,
        outsourcedSupplierId: isOutsourced ? outsourcedSupplierId : undefined,
        outsourcedCost: isOutsourced ? outsourcedCost : undefined,
        materials: isOutsourced ? undefined : quoteLines.map((m) => ({
          lineType: m.lineType,
          materialId: m.materialId,
          description: m.description,
          supplierId: m.supplierId,
          quantity: m.quantity,
          unitPrice: m.unitPrice,
        })),
      })

      // Reset form
      setQuoteLines([])
      setProfitMargin("")
      setClientId("")
      setServiceType("")
      setDescription("")
      setIsOutsourced(false)
      setOutsourcedSupplierId("")
      setOutsourcedCost("")
      toast.success("Cotización guardada")
    } catch (error) {
      logApiError("/quotes", "SAVE", error)
      toast.error("Error al guardar cotización")
    }
  }

  const handleDeleteQuote = async (id: string) => {
    const confirmed = await confirm({
      title: "Eliminar cotización",
      description: "¿Estás seguro de que deseas eliminar esta cotización? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      variant: "destructive",
    })
    if (confirmed) {
      await deleteQuote.mutateAsync(id)
      toast.success("Cotización eliminada")
    }
  }

  const handleCreateOrder = async (quoteId: string) => {
    try {
      await createOrderFromQuote.mutateAsync(quoteId)
      toast.success("Pedido creado exitosamente!")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al crear pedido"
      toast.error(message)
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

  const canSave = isOutsourced
    ? !!(outsourcedSupplierId && outsourcedCost)
    : quoteLines.length > 0
  const showTotals = isOutsourced
    ? !!(outsourcedCost && parseFloat(outsourcedCost) > 0)
    : quoteLines.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold">Cotizador</h1>
        <p className="text-sm text-muted-foreground">
          Crea cotizaciones con materiales, servicios, o trabajos terciarizados
        </p>
      </div>

      {/* Quote Form */}
      <div className="rounded-lg border bg-background p-4 lg:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Nueva Cotización</h2>
          {/* Tercerizado toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isOutsourced}
              onChange={(e) => {
                setIsOutsourced(e.target.checked)
                setQuoteLines([])
                setOutsourcedSupplierId("")
                setOutsourcedCost("")
              }}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium">Tercerizado</span>
          </label>
        </div>

        {/* Client, Service, Description */}
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

        {/* === OUTSOURCED MODE === */}
        {isOutsourced && (
          <div className="space-y-2 rounded-lg border border-dashed p-4 bg-muted/30">
            <Label>Trabajo tercerizado</Label>
            <p className="text-xs text-muted-foreground">Seleccioná el proveedor que hace el trabajo e ingresá el costo.</p>
            <div className="flex flex-wrap gap-2">
              <Select value={outsourcedSupplierId} onValueChange={setOutsourcedSupplierId}>
                <SelectTrigger className="w-48">
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
                placeholder="Costo del proveedor"
                className="w-40"
                value={outsourcedCost}
                onChange={(e) => setOutsourcedCost(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* === NORMAL MODE: Add Line Items === */}
        {!isOutsourced && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Agregar línea</Label>
              {/* Line type toggle */}
              <div className="flex rounded-md border overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => { setLineType("material"); setLineDescription("") }}
                  className={`px-2.5 py-1 flex items-center gap-1 transition-colors ${
                    lineType === "material" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  <Package className="h-3 w-3" /> Material
                </button>
                <button
                  type="button"
                  onClick={() => { setLineType("service"); setSelectedMaterialId(""); setQuantity("1") }}
                  className={`px-2.5 py-1 flex items-center gap-1 transition-colors ${
                    lineType === "service" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  <Wrench className="h-3 w-3" /> Servicio
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {lineType === "material" ? (
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
              ) : (
                <Input
                  placeholder="Descripción del servicio"
                  className="w-48"
                  value={lineDescription}
                  onChange={(e) => setLineDescription(e.target.value)}
                />
              )}

              <Select value={selectedSupplierId} onValueChange={(v) => {
                setSelectedSupplierId(v)
                // Auto-fill price from supplier (only for materials)
                if (lineType === "material") {
                  const sm = supplierMaterials.find((sm) => sm.materialId === selectedMaterialId)
                  if (sm?.currentPrice) {
                    setUnitPrice(sm.currentPrice)
                  }
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
                placeholder={lineType === "service" ? "Cant (1)" : "Cantidad"}
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

              <Button
                onClick={handleAddLine}
                disabled={
                  lineType === "material"
                    ? !selectedMaterialId || !quantity || !unitPrice
                    : !lineDescription || !unitPrice
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Line Items List */}
        {!isOutsourced && quoteLines.length > 0 && (
          <div className="space-y-2">
            <Label>Líneas agregadas</Label>
            <div className="rounded-lg border divide-y">
              {quoteLines.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={m.lineType === "service" ? "secondary" : "outline"} className="text-xs">
                        {m.lineType === "service" ? "Servicio" : "Material"}
                      </Badge>
                      <span className="font-medium">
                        {m.lineType === "material" ? m.materialName : m.description}
                      </span>
                      {m.supplierName && (
                        <span className="text-sm text-muted-foreground">
                          ({m.supplierName})
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {m.quantity} {m.materialUnit || "u."} × ${parseFloat(m.unitPrice).toLocaleString("es-AR")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      ${m.subtotal.toLocaleString("es-AR")}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveLine(m.id)}
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

        {/* Profit Margin & Totals */}
        {showTotals && (
          <div className="flex flex-wrap items-end gap-4 pt-2">
            <div className="space-y-2">
              <Label>{isOutsourced ? "Costo proveedor" : "Costo"}</Label>
              <p className="text-lg font-semibold">
                ${baseCost.toLocaleString("es-AR")}
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
        {canSave && (
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
                  <div className="flex flex-wrap items-center gap-2">
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
                    {quote.isOutsourced && (
                      <Badge variant="secondary" className="text-xs">Tercerizado</Badge>
                    )}
                    {quote.isOutsourced && quote.supplierName && (
                      <span className="text-xs text-muted-foreground">→ {quote.supplierName}</span>
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
      <ConfirmDialog />
    </div>
  )
}
