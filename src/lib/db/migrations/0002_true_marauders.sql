CREATE TABLE "client_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"role" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "person_id" uuid;--> statement-breakpoint
ALTER TABLE "client_relationships" ADD CONSTRAINT "client_relationships_person_id_clients_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_relationships" ADD CONSTRAINT "client_relationships_company_id_clients_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_person_id_clients_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;