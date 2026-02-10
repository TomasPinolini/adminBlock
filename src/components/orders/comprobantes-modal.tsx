"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Upload, FileText, Trash2, ExternalLink, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout"
import { formatDate } from "@/lib/utils/dates"
import type { OrderAttachment } from "@/lib/db/schema"

interface ComprobantesModalProps {
  orderId: string | null
  orderLabel?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ComprobantesModal({
  orderId,
  orderLabel,
  open,
  onOpenChange,
}: ComprobantesModalProps) {
  const [attachments, setAttachments] = useState<OrderAttachment[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { confirm, ConfirmDialog } = useConfirmDialog()

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  const fetchAttachments = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    try {
      const res = await fetchWithTimeout(`/api/orders/${orderId}/comprobantes`)
      if (!res.ok) throw new Error("Error al cargar comprobantes")
      const data = await res.json()
      setAttachments(data)
    } catch {
      toast.error("Error al cargar comprobantes")
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (open && orderId) {
      fetchAttachments()
    }
    if (!open) {
      setAttachments([])
    }
  }, [open, orderId, fetchAttachments])

  const uploadFile = async (file: File) => {
    if (!orderId) return

    if (file.type !== "application/pdf") {
      toast.error("Solo se permiten archivos PDF")
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("El archivo es muy grande. Máximo 10MB.")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetchWithTimeout(`/api/orders/${orderId}/comprobantes`, {
        method: "POST",
        body: formData,
        timeout: 60000,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al subir comprobante")
      }

      toast.success("Comprobante subido")
      await fetchAttachments()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir comprobante")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (file) uploadFile(file)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orderId]
  )

  const handleDelete = async (attachment: OrderAttachment) => {
    if (!orderId) return

    const confirmed = await confirm({
      title: "Eliminar comprobante",
      description: `¿Eliminar "${attachment.fileName}"?`,
      confirmText: "Eliminar",
      variant: "destructive",
    })

    if (!confirmed) return

    try {
      const res = await fetchWithTimeout(
        `/api/orders/${orderId}/comprobantes/${attachment.id}`,
        { method: "DELETE" }
      )

      if (!res.ok) throw new Error("Error al eliminar")

      toast.success("Comprobante eliminado")
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id))
    } catch {
      toast.error("Error al eliminar comprobante")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Comprobantes
              {orderLabel && (
                <span className="text-muted-foreground font-normal text-sm">
                  — {orderLabel}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload dropzone */}
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary hover:bg-muted/50"
              } ${uploading ? "pointer-events-none opacity-60" : ""}`}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 mx-auto text-muted-foreground animate-spin" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Subiendo...
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Arrastrá o hacé click para subir
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Solo archivos PDF (máx. 10MB)
                  </p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Attachments list */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : attachments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No hay comprobantes adjuntos
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <FileText className="h-5 w-5 text-red-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {attachment.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(attachment.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                      >
                        <a
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(attachment)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </>
  )
}
