// Runtime validation utilities

/**
 * Valid invoice types
 */
export const INVOICE_TYPES = ["A", "B", "none"] as const
export type InvoiceType = typeof INVOICE_TYPES[number]

/**
 * Type guard for invoice type validation
 */
export function isValidInvoiceType(value: unknown): value is InvoiceType {
  return typeof value === "string" && INVOICE_TYPES.includes(value as InvoiceType)
}

/**
 * Safely parse invoice type with fallback
 */
export function parseInvoiceType(value: unknown): InvoiceType {
  return isValidInvoiceType(value) ? value : "none"
}

/**
 * Valid order statuses
 */
export const ORDER_STATUSES = [
  "pending_quote",
  "pending_approval", 
  "in_progress",
  "ready",
  "delivered",
  "cancelled"
] as const
export type OrderStatus = typeof ORDER_STATUSES[number]

/**
 * Type guard for order status validation
 */
export function isValidOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus)
}

/**
 * Valid payment statuses
 */
export const PAYMENT_STATUSES = ["pending", "partial", "paid"] as const
export type PaymentStatus = typeof PAYMENT_STATUSES[number]

/**
 * Type guard for payment status validation
 */
export function isValidPaymentStatus(value: unknown): value is PaymentStatus {
  return typeof value === "string" && PAYMENT_STATUSES.includes(value as PaymentStatus)
}
