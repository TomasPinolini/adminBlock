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

export const activityTypeEnum = pgEnum("activity_type", [
  "order_created",
  "order_updated",
  "order_status_changed",
  "order_deleted",
  "order_duplicated",
  "client_created",
  "client_updated",
  "client_deleted",
  "comment_added",
  "payment_registered",
])

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "partial",
  "paid",
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
  // Payment fields
  paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
  paymentAmount: numeric("payment_amount", { precision: 10, scale: 2 }),
  receiptUrl: text("receipt_url"),
  paidAt: timestamp("paid_at"),
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

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  activityType: activityTypeEnum("activity_type").notNull(),
  userId: uuid("user_id"), // References auth.users
  userEmail: text("user_email"),
  entityType: text("entity_type").notNull(), // "order", "client"
  entityId: uuid("entity_id").notNull(),
  description: text("description").notNull(),
  metadata: text("metadata"), // JSON string for extra details
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

export type ActivityLog = typeof activityLogs.$inferSelect
export type NewActivityLog = typeof activityLogs.$inferInsert

export type ServiceType = (typeof serviceTypeEnum.enumValues)[number]
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number]
export type ActivityType = (typeof activityTypeEnum.enumValues)[number]
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number]
