/**
 * Invoice calculation utilities
 */

export const IVA_RATE = 0.21 // 21% IVA in Argentina

export type InvoiceType = "A" | "B" | "none"

/**
 * Calculate IVA amount from subtotal
 */
export function calculateIVA(subtotal: number): number {
  return subtotal * IVA_RATE
}

/**
 * Calculate total from subtotal (subtotal + IVA)
 */
export function calculateTotal(subtotal: number): number {
  return subtotal + calculateIVA(subtotal)
}

/**
 * Calculate subtotal from total (reverse calculation)
 */
export function calculateSubtotalFromTotal(total: number): number {
  return total / (1 + IVA_RATE)
}

/**
 * Calculate IVA from total (reverse calculation)
 */
export function calculateIVAFromTotal(total: number): number {
  const subtotal = calculateSubtotalFromTotal(total)
  return total - subtotal
}

/**
 * Format currency for Argentina
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Calculate invoice breakdown based on type
 */
export function calculateInvoiceBreakdown(
  price: number,
  invoiceType: InvoiceType
): {
  subtotal: number
  taxAmount: number
  total: number
} {
  if (invoiceType === "A") {
    // Factura A: price is the total, need to extract IVA
    const subtotal = calculateSubtotalFromTotal(price)
    const taxAmount = calculateIVAFromTotal(price)
    return {
      subtotal,
      taxAmount,
      total: price,
    }
  } else {
    // Factura B or none: price is the final amount (no IVA breakdown)
    return {
      subtotal: price,
      taxAmount: 0,
      total: price,
    }
  }
}

/**
 * Validate CUIT format (basic validation)
 * CUIT format: XX-XXXXXXXX-X (11 digits)
 */
export function validateCUIT(cuit: string): boolean {
  // Remove hyphens and spaces
  const cleaned = cuit.replace(/[-\s]/g, "")
  
  // Must be 11 digits
  if (cleaned.length !== 11) return false
  
  // Must be all numbers
  if (!/^\d+$/.test(cleaned)) return false
  
  return true
}

/**
 * Format CUIT with hyphens
 */
export function formatCUIT(cuit: string): string {
  const cleaned = cuit.replace(/[-\s]/g, "")
  
  if (cleaned.length !== 11) return cuit
  
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10)}`
}
