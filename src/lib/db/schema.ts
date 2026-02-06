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

export const clientTypeEnum = pgEnum("client_type", [
  "individual",
  "company",
])

// Tables
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientType: clientTypeEnum("client_type").default("individual").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  instagramHandle: text("instagram_handle"),
  cuit: text("cuit"), // CUIT for invoicing
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Contacts for companies (people who call from a company) - LEGACY, use clientRelationships instead
export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  instagramHandle: text("instagram_handle"),
  role: text("role"), // e.g., "Secretaria", "Gerente", "Encargado"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Links individual clients to company clients (many-to-many)
export const clientRelationships = pgTable("client_relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .references(() => clients.id, { onDelete: "cascade" })
    .notNull(),
  companyId: uuid("company_id")
    .references(() => clients.id, { onDelete: "cascade" })
    .notNull(),
  role: text("role"), // e.g., "Secretaria", "Gerente", "Dueño"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  contactId: uuid("contact_id")
    .references(() => contacts.id, { onDelete: "set null" }),
  // Person who made the order (when clientId is a company)
  personId: uuid("person_id")
    .references(() => clients.id, { onDelete: "set null" }),
  serviceType: serviceTypeEnum("service_type").notNull(),
  status: orderStatusEnum("status").default("pending_quote").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }),
  dueDate: date("due_date"),
  // Invoice fields
  invoiceNumber: text("invoice_number"), // e.g., "3079", "1209"
  invoiceType: text("invoice_type").default("none"), // "A", "B", or "none"
  quantity: numeric("quantity", { precision: 10, scale: 2 }), // cantidad de unidades
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }), // monto sin IVA
  taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }), // monto de IVA (21%)
  // Payment fields
  paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
  paymentAmount: numeric("payment_amount", { precision: 10, scale: 2 }),
  receiptUrl: text("receipt_url"),
  paidAt: timestamp("paid_at"),
  isArchived: text("is_archived").default("false").notNull(), // soft delete for delivered+paid
  archivedAt: timestamp("archived_at"),
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

// App settings (key-value store)
export const appSettings = pgTable("app_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Suppliers (proveedores)
export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  isActive: text("is_active").default("true").notNull(), // soft delete
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Materials catalog (global list of materials)
export const materials = pgTable("materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  unit: text("unit").notNull(), // "metro", "unidad", "hoja", "m2", etc.
  notes: text("notes"),
  isActive: text("is_active").default("true").notNull(), // soft delete
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Which materials each supplier offers (with their price)
export const supplierMaterials = pgTable("supplier_materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  supplierId: uuid("supplier_id")
    .references(() => suppliers.id, { onDelete: "cascade" })
    .notNull(),
  materialId: uuid("material_id")
    .references(() => materials.id, { onDelete: "cascade" })
    .notNull(),
  currentPrice: numeric("current_price", { precision: 10, scale: 2 }), // last known price from this supplier
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Which materials are typically used for each service type
export const serviceMaterials = pgTable("service_materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceType: serviceTypeEnum("service_type").notNull(),
  materialId: uuid("material_id")
    .references(() => materials.id, { onDelete: "cascade" })
    .notNull(),
  defaultQuantity: numeric("default_quantity", { precision: 10, scale: 2 }),
  isRequired: text("is_required").default("false").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Quotes (cotizaciones) - saved quotes that can become orders
export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id),
  serviceType: serviceTypeEnum("service_type"),
  description: text("description"),
  materialsCost: numeric("materials_cost", { precision: 10, scale: 2 }), // sum of all materials
  profitMargin: numeric("profit_margin", { precision: 10, scale: 2 }), // profit amount
  profitType: text("profit_type").default("fixed"), // "fixed" or "percentage"
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }), // materialsCost + profit
  orderId: uuid("order_id").references(() => orders.id), // if converted to order
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Materials in a quote
export const quoteMaterials = pgTable("quote_materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id")
    .references(() => quotes.id, { onDelete: "cascade" })
    .notNull(),
  materialId: uuid("material_id")
    .references(() => materials.id, { onDelete: "restrict" })
    .notNull(),
  supplierId: uuid("supplier_id")
    .references(() => suppliers.id, { onDelete: "restrict" }),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Materials used in a specific order (for quoting)
export const orderMaterials = pgTable("order_materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  materialId: uuid("material_id")
    .references(() => materials.id, { onDelete: "restrict" })
    .notNull(),
  supplierId: uuid("supplier_id")
    .references(() => suppliers.id, { onDelete: "restrict" }),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(), // price at time of quote
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(), // quantity * unitPrice
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Relations
export const clientsRelations = relations(clients, ({ many }) => ({
  orders: many(orders),
  contacts: many(contacts),
  // Relationships where this client is the person (individual)
  employments: many(clientRelationships, { relationName: "person" }),
  // Relationships where this client is the company
  employees: many(clientRelationships, { relationName: "company" }),
}))

export const clientRelationshipsRelations = relations(clientRelationships, ({ one }) => ({
  person: one(clients, {
    fields: [clientRelationships.personId],
    references: [clients.id],
    relationName: "person",
  }),
  company: one(clients, {
    fields: [clientRelationships.companyId],
    references: [clients.id],
    relationName: "company",
  }),
}))

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  client: one(clients, {
    fields: [contacts.clientId],
    references: [clients.id],
  }),
  orders: many(orders),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  client: one(clients, {
    fields: [orders.clientId],
    references: [clients.id],
    relationName: "orderClient",
  }),
  contact: one(contacts, {
    fields: [orders.contactId],
    references: [contacts.id],
  }),
  person: one(clients, {
    fields: [orders.personId],
    references: [clients.id],
    relationName: "orderPerson",
  }),
  comments: many(orderComments),
  attachments: many(orderAttachments),
  materials: many(orderMaterials),
}))

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  supplierMaterials: many(supplierMaterials),
  orderMaterials: many(orderMaterials),
  quoteMaterials: many(quoteMaterials),
}))

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  client: one(clients, {
    fields: [quotes.clientId],
    references: [clients.id],
  }),
  order: one(orders, {
    fields: [quotes.orderId],
    references: [orders.id],
  }),
  materials: many(quoteMaterials),
}))

export const quoteMaterialsRelations = relations(quoteMaterials, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteMaterials.quoteId],
    references: [quotes.id],
  }),
  material: one(materials, {
    fields: [quoteMaterials.materialId],
    references: [materials.id],
  }),
  supplier: one(suppliers, {
    fields: [quoteMaterials.supplierId],
    references: [suppliers.id],
  }),
}))

export const materialsRelations = relations(materials, ({ many }) => ({
  serviceMaterials: many(serviceMaterials),
  orderMaterials: many(orderMaterials),
  supplierMaterials: many(supplierMaterials),
  quoteMaterials: many(quoteMaterials),
}))

export const supplierMaterialsRelations = relations(supplierMaterials, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierMaterials.supplierId],
    references: [suppliers.id],
  }),
  material: one(materials, {
    fields: [supplierMaterials.materialId],
    references: [materials.id],
  }),
}))

export const serviceMaterialsRelations = relations(serviceMaterials, ({ one }) => ({
  material: one(materials, {
    fields: [serviceMaterials.materialId],
    references: [materials.id],
  }),
}))

export const orderMaterialsRelations = relations(orderMaterials, ({ one }) => ({
  order: one(orders, {
    fields: [orderMaterials.orderId],
    references: [orders.id],
  }),
  material: one(materials, {
    fields: [orderMaterials.materialId],
    references: [materials.id],
  }),
  supplier: one(suppliers, {
    fields: [orderMaterials.supplierId],
    references: [suppliers.id],
  }),
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

export type Contact = typeof contacts.$inferSelect
export type NewContact = typeof contacts.$inferInsert

export type ClientRelationship = typeof clientRelationships.$inferSelect
export type NewClientRelationship = typeof clientRelationships.$inferInsert

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

export type AppSetting = typeof appSettings.$inferSelect
export type NewAppSetting = typeof appSettings.$inferInsert

export type Supplier = typeof suppliers.$inferSelect
export type NewSupplier = typeof suppliers.$inferInsert

export type Material = typeof materials.$inferSelect
export type NewMaterial = typeof materials.$inferInsert

export type SupplierMaterial = typeof supplierMaterials.$inferSelect
export type NewSupplierMaterial = typeof supplierMaterials.$inferInsert

export type ServiceMaterial = typeof serviceMaterials.$inferSelect
export type NewServiceMaterial = typeof serviceMaterials.$inferInsert

export type OrderMaterial = typeof orderMaterials.$inferSelect
export type NewOrderMaterial = typeof orderMaterials.$inferInsert

export type Quote = typeof quotes.$inferSelect
export type NewQuote = typeof quotes.$inferInsert

export type QuoteMaterial = typeof quoteMaterials.$inferSelect
export type NewQuoteMaterial = typeof quoteMaterials.$inferInsert

export type ServiceType = (typeof serviceTypeEnum.enumValues)[number]
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number]
export type ActivityType = (typeof activityTypeEnum.enumValues)[number]
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number]
export type ClientType = (typeof clientTypeEnum.enumValues)[number]
