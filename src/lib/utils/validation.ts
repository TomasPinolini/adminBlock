// Runtime validation utilities
import { z } from "zod"

// ─── Text Sanitization ──────────────────────────────────────────────

/**
 * Strip HTML tags and trim whitespace to prevent XSS in stored text.
 * Does NOT strip markdown or normal punctuation — only HTML-like tags.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/javascript:/gi, "") // strip JS protocol
    .replace(/on\w+\s*=/gi, "") // strip inline event handlers
    .trim()
}

/**
 * Zod transform that sanitizes a string. Use with .transform(sanitize).
 */
export function sanitize(val: string): string {
  return sanitizeText(val)
}

// ─── Numeric Validation ──────────────────────────────────────────────

/**
 * Parse a value to a finite non-NaN number. Returns 0 for invalid input.
 */
export function safeParseNumber(value: unknown): number {
  const num = typeof value === "string" ? parseFloat(value) : Number(value)
  if (!Number.isFinite(num)) return 0
  return num
}

/**
 * Zod schema for a numeric string (e.g. "123.45").
 * Rejects NaN, Infinity, and negative values.
 */
export const numericString = z
  .string()
  .refine(
    (val) => { const n = parseFloat(val); return Number.isFinite(n) && n >= 0 },
    { message: "Debe ser un número válido (≥ 0)" }
  )

/**
 * Zod schema for a numeric string that also allows null (for update schemas).
 */
export const numericStringNullable = z
  .string()
  .refine(
    (val) => { const n = parseFloat(val); return Number.isFinite(n) && n >= 0 },
    { message: "Debe ser un número válido (≥ 0)" }
  )
  .nullable()

// ─── Shared field constraints ────────────────────────────────────────

export const MAX_TEXT_SHORT = 200  // names, categories, roles
export const MAX_TEXT_MEDIUM = 500 // descriptions, notes
export const MAX_TEXT_LONG = 2000  // comments, long notes

// ─── Type Guards ─────────────────────────────────────────────────────

/**
 * Valid invoice types
 */
export const INVOICE_TYPES = ["A", "B", "C", "NC_C", "ND_C", "R_C", "C_E", "NC_C_E", "ND_C_E", "none"] as const
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
