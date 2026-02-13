"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { toast } from "sonner"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { Plus, Trash2, Copy, Check, FileText, ShoppingCart, Search, ChevronDown, ChevronUp } from "lucide-react"
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
import { Combobox } from "@/components/ui/combobox"
import { useServices } from "@/hooks/use-services"
import { useMaterials } from "@/hooks/use-materials"
import { useSuppliers, useSupplierMaterials } from "@/hooks/use-suppliers"
import { useQuotes, useQuote, useCreateQuote, useDeleteQuote, useCreateOrderFromQuote } from "@/hooks/use-quotes"
import { useClients } from "@/hooks/use-clients"
import { logApiError } from "@/lib/logger"

interface QuoteLineItem {
  id: string
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
  const { data: services = [] } = useServices()
  const { data: quotes = [], isLoading: quotesLoading } = useQuotes()
  const createQuote = useCreateQuote()
  const deleteQuote = useDeleteQuote()
  const createOrderFromQuote = useCreateOrderFromQuote()

  // Form state
  const [isOutsourced, setIsOutsourced] = useState(false)
  const [outsourcedSupplierId, setOutsourcedSupplierId] = useState("")
  const [outsourcedCost, setOutsourcedCost] = useState("")
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
  const [deliveryDate, setDeliveryDate] = useState("")
  const [copied, setCopied] = useState(false)
  const [quoteSearch, setQuoteSearch] = useState("")
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null)

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
    if (!selectedMaterialId || !quantity || !unitPrice) return
    const material = materials.find((m) => m.id === selectedMaterialId)
    const supplier = suppliers.find((s) => s.id === selectedSupplierId)
    const qty = parseFloat(quantity)
    const price = parseFloat(unitPrice)
    if (!material || isNaN(qty) || isNaN(price)) return

    const newItem: QuoteLineItem = {
      id: crypto.randomUUID(),
      materialId: selectedMaterialId,
      materialName: material.name,
      materialUnit: material.unit,
      description: lineDescription || undefined,
      supplierId: selectedSupplierId || undefined,
      supplierName: supplier?.name,
      quantity,
      unitPrice,
      subtotal: qty * price,
    }
    setQuoteLines([...quoteLines, newItem])
    setSelectedMaterialId("")
    setSelectedSupplierId("")
    setLineDescription("")
    setQuantity("")
    setUnitPrice("")
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
        deliveryDate: deliveryDate || undefined,
        profitMargin: profitMargin || "0",
        profitType,
        isOutsourced,
        outsourcedSupplierId: isOutsourced ? outsourcedSupplierId : undefined,
        outsourcedCost: isOutsourced ? outsourcedCost : undefined,
        materials: isOutsourced ? undefined : quoteLines.map((m) => ({
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
      setDeliveryDate("")
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

  const getServiceLabel = (name: string) => {
    const svc = services.find((s) => s.name === name)
    return svc?.displayName || name
  }

  const quoteText = totalPrice > 0
    ? `Hola! Tu cotización${serviceType ? ` para ${getServiceLabel(serviceType)}` : ""}: $${totalPrice.toLocaleString("es-AR")}`
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
          Crea cotizaciones con materiales o trabajos terciarizados
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

        {/* Client, Service, Description, Delivery Date */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Cliente (opcional)</Label>
            <Combobox
              options={clients.map((c) => ({ value: c.id, label: c.name }))}
              value={clientId}
              onValueChange={setClientId}
              placeholder="Seleccionar cliente"
              searchPlaceholder="Buscar cliente..."
              emptyText="Sin resultados."
            />
          </div>
          <div className="space-y-2">
            <Label>Servicio (opcional)</Label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de servicio" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.displayName}
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
          <div className="space-y-2">
            <Label>Fecha de entrega (opcional)</Label>
            <Input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>
        </div>

        {/* === OUTSOURCED MODE === */}
        {isOutsourced && (
          <div className="space-y-2 rounded-lg border border-dashed p-4 bg-muted/30">
            <Label>Trabajo tercerizado</Label>
            <p className="text-xs text-muted-foreground">Seleccioná el proveedor que hace el trabajo e ingresá el costo.</p>
            <div className="flex flex-wrap gap-2">
              <Combobox
                options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
                value={outsourcedSupplierId}
                onValueChange={setOutsourcedSupplierId}
                placeholder="Proveedor"
                searchPlaceholder="Buscar proveedor..."
                emptyText="Sin resultados."
                className="w-48"
              />
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
            <Label>Agregar material</Label>

            <div className="flex flex-wrap gap-2">
              <Combobox
                options={materials.map((m) => ({ value: m.id, label: `${m.name} (${m.unit})` }))}
                value={selectedMaterialId}
                onValueChange={(v) => {
                  setSelectedMaterialId(v)
                  setUnitPrice("")
                }}
                placeholder="Material"
                searchPlaceholder="Buscar material..."
                emptyText="Sin resultados."
                className="w-40"
              />

              <Input
                placeholder="Nota (opcional)"
                className="w-40"
                value={lineDescription}
                onChange={(e) => setLineDescription(e.target.value)}
              />

              <Combobox
                options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
                value={selectedSupplierId}
                onValueChange={(v) => {
                  setSelectedSupplierId(v)
                  // Auto-fill price from supplier
                  const sm = supplierMaterials.find((sm) => sm.materialId === selectedMaterialId)
                  if (sm?.currentPrice) {
                    setUnitPrice(sm.currentPrice)
                  }
                }}
                placeholder="Proveedor"
                searchPlaceholder="Buscar proveedor..."
                emptyText="Sin resultados."
                className="w-40"
              />

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

              <Button
                onClick={handleAddLine}
                disabled={!selectedMaterialId || !quantity || !unitPrice}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Line Items List */}
        {!isOutsourced && quoteLines.length > 0 && (
          <div className="space-y-2">
            <Label>Materiales agregados</Label>
            <div className="rounded-lg border divide-y">
              {quoteLines.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.materialName}</span>
                      {m.description && (
                        <span className="text-sm text-muted-foreground italic">
                          {m.description}
                        </span>
                      )}
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
              <Label>{isOutsourced ? "Costo proveedor" : "Costo materiales"}</Label>
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
              <Label className="text-base font-semibold">Costo cotizado total</Label>
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="font-semibold">Cotizaciones Guardadas</h2>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente..."
              value={quoteSearch}
              onChange={(e) => setQuoteSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

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
          <div className="space-y-3">
            {quotes
              .filter((q) => {
                if (!quoteSearch) return true
                const search = quoteSearch.toLowerCase()
                return (
                  q.clientName?.toLowerCase().includes(search) ||
                  q.description?.toLowerCase().includes(search) ||
                  q.supplierName?.toLowerCase().includes(search)
                )
              })
              .map((quote) => (
              <div
                key={quote.id}
                className="rounded-lg border bg-background p-4 space-y-3"
              >
                {/* Header: name + badges + delete */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {quote.clientName && (
                        <span className="font-medium text-base">{quote.clientName}</span>
                      )}
                      {quote.serviceType && (
                        <span className="text-sm text-muted-foreground">
                          {services.find((s) => s.name === quote.serviceType)?.displayName || quote.serviceType}
                        </span>
                      )}
                      {!quote.clientName && !quote.serviceType && (
                        <span className="text-muted-foreground">Sin cliente</span>
                      )}
                      {quote.isOutsourced && (
                        <Badge variant="secondary" className="text-xs">Tercerizado</Badge>
                      )}
                      {quote.isOutsourced && quote.supplierName && (
                        <span className="text-xs text-muted-foreground">{quote.supplierName}</span>
                      )}
                    </div>
                    {quote.deliveryDate && (
                      <div className="text-sm text-muted-foreground mt-0.5">
                        Entrega: {new Date(quote.deliveryDate + "T00:00:00").toLocaleDateString("es-AR")}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground mt-0.5">
                      Costo: ${Number(quote.materialsCost || 0).toLocaleString("es-AR")} | Ganancia: ${Number(quote.profitMargin || 0).toLocaleString("es-AR")}{quote.profitType === "percentage" ? "%" : ""}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteQuote(quote.id)}
                    className="text-destructive hover:text-destructive shrink-0 h-9 w-9"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Footer: total price + actions */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/50">
                  <p className="text-lg font-bold text-primary whitespace-nowrap">
                    Total: ${Number(quote.totalPrice || 0).toLocaleString("es-AR")}
                  </p>
                  <div className="flex items-center gap-2">
                    {quote.orderId && (
                      <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-2 py-1 rounded-md whitespace-nowrap">
                        Pedido creado
                      </span>
                    )}
                    {!quote.orderId && quote.clientId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateOrder(quote.id)}
                        disabled={createOrderFromQuote.isPending}
                        className="h-9"
                      >
                        <ShoppingCart className="mr-1.5 h-4 w-4" />
                        Crear Pedido
                      </Button>
                    )}
                    {!quote.isOutsourced && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedQuoteId(expandedQuoteId === quote.id ? null : quote.id)}
                        title="Ver detalle"
                        className="h-9 w-9 shrink-0"
                      >
                        {expandedQuoteId === quote.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
                {expandedQuoteId === quote.id && (
                  <QuoteDetailPanel quoteId={quote.id} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog />
    </div>
  )
}

function QuoteDetailPanel({ quoteId }: { quoteId: string }) {
  const { data: detail, isLoading } = useQuote(quoteId)

  if (isLoading) {
    return <div className="mt-3 h-16 animate-pulse rounded bg-muted" />
  }

  if (!detail?.materials?.length) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">Sin detalle de materiales</p>
    )
  }

  return (
    <div className="mt-3 border-t pt-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">Detalle de materiales</p>
      <div className="rounded-lg border divide-y text-sm">
        {detail.materials.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-3 py-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {m.materialName || m.description || "Material"}
                </span>
                {m.description && m.materialName && (
                  <span className="text-xs text-muted-foreground italic">{m.description}</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {m.supplierName && <span className="mr-2">Proveedor: {m.supplierName}</span>}
                {m.quantity} {m.materialUnit || "u."} × ${parseFloat(m.unitPrice).toLocaleString("es-AR")}
              </div>
            </div>
            <span className="font-semibold whitespace-nowrap">
              ${parseFloat(m.subtotal).toLocaleString("es-AR")}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
