/**
 * Fetch wrapper with timeout support
 * Prevents requests from hanging indefinitely
 */

export class FetchTimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FetchTimeoutError"
  }
}

export interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number // milliseconds
}

/**
 * Fetch with automatic timeout
 * @param url - URL to fetch
 * @param options - Fetch options including timeout (default 30s)
 * @returns Promise with fetch response
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === "AbortError") {
      throw new FetchTimeoutError(
        `Request timeout after ${timeout}ms: ${url}`
      )
    }
    
    throw error
  }
}

/**
 * Fetch with timeout and JSON parsing
 */
export async function fetchJSON<T = any>(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<T> {
  const response = await fetchWithTimeout(url, options)
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    throw new Error(`HTTP ${response.status}: ${errorText}`)
  }
  
  return response.json()
}
