import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  numeric,
  date,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Enums
export const serviceTypeEnum = pgEnum("service_type", [
  "copiado",
  "tesis",
  "encuadernacion",
  "carteleria",
  "placas",
  "calcos",
  "folleteria",
  "ploteo",
])

export const orderStatusEnum = pgEnum("order_status", [
  "pending_quote",
  "quoted",
  "approved",
  "in_progress",
  "ready",
  "delivered",
  "cancelled",
])

// Tables
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone"),
  instagramHandle: text("instagram_handle"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  serviceType: serviceTypeEnum("service_type").notNull(),
  status: orderStatusEnum("status").default("pending_quote").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const orderComments = pgTable("order_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id").notNull(), // References auth.users
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const orderAttachments = pgTable("order_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const servicePrices = pgTable("service_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceType: serviceTypeEnum("service_type").notNull(),
  variantName: text("variant_name").notNull(),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }),
  pricePerUnit: numeric("price_per_unit", { precision: 10, scale: 2 }),
  unitType: text("unit_type"), // "pagina", "unidad", "metro", etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Relations
export const clientsRelations = relations(clients, ({ many }) => ({
  orders: many(orders),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  client: one(clients, {
    fields: [orders.clientId],
    references: [clients.id],
  }),
  comments: many(orderComments),
  attachments: many(orderAttachments),
}))

export const orderCommentsRelations = relations(orderComments, ({ one }) => ({
  order: one(orders, {
    fields: [orderComments.orderId],
    references: [orders.id],
  }),
}))

export const orderAttachmentsRelations = relations(orderAttachments, ({ one }) => ({
  order: one(orders, {
    fields: [orderAttachments.orderId],
    references: [orders.id],
  }),
}))

// Types
export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert

export type OrderComment = typeof orderComments.$inferSelect
export type NewOrderComment = typeof orderComments.$inferInsert

export type OrderAttachment = typeof orderAttachments.$inferSelect
export type NewOrderAttachment = typeof orderAttachments.$inferInsert

export type ServicePrice = typeof servicePrices.$inferSelect
export type NewServicePrice = typeof servicePrices.$inferInsert

export type ServiceType = (typeof serviceTypeEnum.enumValues)[number]
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number]
