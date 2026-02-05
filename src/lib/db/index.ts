import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

function createClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set")
  }

  return postgres(connectionString, {
    prepare: false,
    ssl: 'require',
    max: 1,
  })
}

// Lazy initialization
let _db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!_db) {
    const client = createClient()
    _db = drizzle(client, { schema })
  }
  return _db
}

// For backwards compatibility - but this will throw on import if DATABASE_URL is missing
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    return (getDb() as any)[prop]
  },
})

export * from "./schema"
