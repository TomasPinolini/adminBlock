import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchWithTimeout } from "@/lib/utils/fetch-with-timeout"

interface CuitLookupResult {
  Contribuyente?: {
    idPersona: number
    tipoPersona: string
    tipoClave: string
    estadoClave: string
    nombre: string
    domicilioFiscal?: {
      direccion: string
      localidad: string
      codPostal: string
      idProvincia: number
      descripcionProvincia: string
    }
  }
  errorGetData?: boolean
  errorMessage?: string
}

interface NextNumberResult {
  number: number
  puntoVenta: string
  invoiceType: string
}

async function lookupCuit(cuit: string): Promise<CuitLookupResult> {
  const cleaned = cuit.replace(/[-\s]/g, "")
  const res = await fetchWithTimeout(`/api/afip/cuit-lookup?cuit=${cleaned}`, { timeout: 10000 })
  if (!res.ok) throw new Error("Error al consultar CUIT")
  return res.json()
}

async function peekNextNumber(invoiceType: string, puntoVenta = "00001"): Promise<NextNumberResult> {
  const res = await fetchWithTimeout(
    `/api/invoices/next-number/peek?invoiceType=${invoiceType}&puntoVenta=${puntoVenta}`,
    { timeout: 10000 }
  )
  if (!res.ok) throw new Error("Error al obtener próximo número")
  return res.json()
}

async function consumeNextNumber(invoiceType: string, puntoVenta = "00001"): Promise<NextNumberResult> {
  const res = await fetchWithTimeout("/api/invoices/next-number", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoiceType, puntoVenta }),
    timeout: 10000,
  })
  if (!res.ok) throw new Error("Error al consumir número de factura")
  return res.json()
}

export function useCuitLookup(cuit: string | null) {
  return useQuery({
    queryKey: ["cuit-lookup", cuit],
    queryFn: () => lookupCuit(cuit!),
    enabled: !!cuit && cuit.replace(/[-\s]/g, "").length === 11,
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  })
}

export function useNextInvoiceNumber(invoiceType: string | null, puntoVenta = "00001") {
  return useQuery({
    queryKey: ["invoice-next-number", invoiceType, puntoVenta],
    queryFn: () => peekNextNumber(invoiceType!, puntoVenta),
    enabled: !!invoiceType && invoiceType !== "none",
    staleTime: 10 * 1000, // 10 seconds
  })
}

export function useConsumeInvoiceNumber() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invoiceType, puntoVenta }: { invoiceType: string; puntoVenta?: string }) =>
      consumeNextNumber(invoiceType, puntoVenta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice-next-number"] })
    },
  })
}
