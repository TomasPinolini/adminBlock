import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL!

// For serverless with Supabase pooler
const client = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
  max: 1, // Limit connections for serverless
})

export const db = drizzle(client, { schema })

export * from "./schema"
