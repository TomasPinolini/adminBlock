/**
 * Server-side logger for AdminBlock
 * Provides descriptive, colored console output during development
 */

const isDev = process.env.NODE_ENV !== "production"

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgYellow: "\x1b[43m",
  bold: "\x1b[1m",
}

function timestamp(): string {
  return new Date().toLocaleTimeString("es-AR", { hour12: false })
}

function classifyError(error: unknown): { type: string; detail: string } {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()

    // Database errors
    if (msg.includes("connect") || msg.includes("connection")) {
      return { type: "DB_CONNECTION", detail: "No se pudo conectar a la base de datos. ¿Está corriendo Supabase?" }
    }
    if (msg.includes("relation") && msg.includes("does not exist")) {
      const table = error.message.match(/relation "(.+?)"/)?.[1] || "desconocida"
      return { type: "DB_TABLE_MISSING", detail: `La tabla "${table}" no existe. ¿Falta correr una migración?` }
    }
    if (msg.includes("column") && msg.includes("does not exist")) {
      const col = error.message.match(/column "(.+?)"/)?.[1] || "desconocida"
      return { type: "DB_COLUMN_MISSING", detail: `La columna "${col}" no existe. ¿Falta correr una migración?` }
    }
    if (msg.includes("duplicate key") || msg.includes("unique constraint")) {
      const constraint = error.message.match(/constraint "(.+?)"/)?.[1] || ""
      return { type: "DB_DUPLICATE", detail: `Registro duplicado (constraint: ${constraint})` }
    }
    if (msg.includes("foreign key") || msg.includes("violates foreign key")) {
      return { type: "DB_FK_VIOLATION", detail: "Violación de foreign key - el registro referenciado no existe o tiene dependencias" }
    }
    if (msg.includes("null value in column")) {
      const col = error.message.match(/column "(.+?)"/)?.[1] || "desconocida"
      return { type: "DB_NULL_VIOLATION", detail: `La columna "${col}" no puede ser null` }
    }
    if (msg.includes("timeout") || msg.includes("timed out")) {
      return { type: "DB_TIMEOUT", detail: "Query tardó demasiado. ¿La base de datos está saturada?" }
    }
    if (msg.includes("too many connections") || msg.includes("remaining connection slots")) {
      return { type: "DB_POOL_EXHAUSTED", detail: "Sin conexiones disponibles. Revisar max pool size" }
    }

    // Auth errors
    if (msg.includes("jwt") || msg.includes("token") || msg.includes("unauthorized")) {
      return { type: "AUTH", detail: "Error de autenticación - token inválido o expirado" }
    }

    // Validation errors
    if (msg.includes("zod") || msg.includes("validation") || msg.includes("parse")) {
      return { type: "VALIDATION", detail: "Datos de entrada inválidos" }
    }

    // Network/fetch errors
    if (msg.includes("fetch") || msg.includes("econnrefused") || msg.includes("network")) {
      return { type: "NETWORK", detail: "Error de red - servicio externo no disponible" }
    }

    // Storage errors
    if (msg.includes("storage") || msg.includes("upload") || msg.includes("bucket")) {
      return { type: "STORAGE", detail: "Error de almacenamiento (Supabase Storage)" }
    }

    return { type: "UNKNOWN", detail: error.message }
  }

  return { type: "UNKNOWN", detail: String(error) }
}

/**
 * Log an API error with rich context
 */
export function logApiError(
  route: string,
  method: string,
  error: unknown,
  extra?: Record<string, unknown>
): void {
  const { type, detail } = classifyError(error)
  const ts = timestamp()
  const errorObj = error instanceof Error ? error : new Error(String(error))

  console.error(
    `\n${colors.bgRed}${colors.white}${colors.bold} ERROR ${colors.reset} ` +
    `${colors.gray}${ts}${colors.reset} ` +
    `${colors.cyan}${method}${colors.reset} ${colors.white}${route}${colors.reset}`
  )
  console.error(
    `  ${colors.yellow}Tipo:${colors.reset}    ${type}`
  )
  console.error(
    `  ${colors.yellow}Detalle:${colors.reset} ${detail}`
  )

  if (extra && Object.keys(extra).length > 0) {
    console.error(
      `  ${colors.yellow}Context:${colors.reset}`, JSON.stringify(extra, null, 2)
    )
  }

  if (isDev && errorObj.stack) {
    const stackLines = errorObj.stack.split("\n").slice(1, 5).map(l => `  ${colors.gray}${l.trim()}${colors.reset}`)
    console.error(stackLines.join("\n"))
  }

  console.error("") // blank line for readability
}

/**
 * Log an API request (info level, only in dev)
 */
export function logApiRequest(route: string, method: string, extra?: Record<string, unknown>): void {
  if (!isDev) return
  const ts = timestamp()
  console.log(
    `${colors.blue}→${colors.reset} ${colors.gray}${ts}${colors.reset} ` +
    `${colors.cyan}${method}${colors.reset} ${route}` +
    (extra ? ` ${colors.gray}${JSON.stringify(extra)}${colors.reset}` : "")
  )
}

/**
 * Log a warning
 */
export function logWarning(route: string, message: string): void {
  const ts = timestamp()
  console.warn(
    `${colors.bgYellow}${colors.bold} WARN ${colors.reset} ` +
    `${colors.gray}${ts}${colors.reset} ` +
    `${colors.white}${route}${colors.reset} - ${message}`
  )
}
