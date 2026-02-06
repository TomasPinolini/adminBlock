import { NextResponse } from "next/server"

/**
 * Standard API error response format
 */
export interface ApiError {
  error: string
  message?: string
  details?: unknown
}

/**
 * Standard API success response format
 */
export interface ApiSuccess<T = unknown> {
  data: T
  message?: string
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  error: string,
  status: number = 500,
  details?: unknown
): NextResponse<ApiError> {
  const response: ApiError = {
    error,
    message: error,
  }
  
  if (details) {
    response.details = details
  }
  
  return NextResponse.json(response, { status })
}

/**
 * Create a standardized success response
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  message?: string
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      data,
      ...(message && { message }),
    },
    { status }
  )
}

/**
 * Common error responses
 */
export const ApiErrors = {
  notFound: (resource: string = "Resource") =>
    errorResponse(`${resource} not found`, 404),
  
  unauthorized: (message: string = "Unauthorized") =>
    errorResponse(message, 401),
  
  forbidden: (message: string = "Forbidden") =>
    errorResponse(message, 403),
  
  badRequest: (message: string = "Bad request") =>
    errorResponse(message, 400),
  
  validationError: (details: unknown) =>
    errorResponse("Validation error", 400, details),
  
  serverError: (message: string = "Internal server error") =>
    errorResponse(message, 500),
  
  methodNotAllowed: (allowed: string[]) =>
    errorResponse(`Method not allowed. Allowed: ${allowed.join(", ")}`, 405),
} as const
