-- Add client_type enum
DO $$ BEGIN
    CREATE TYPE "public"."client_type" AS ENUM('individual', 'company');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Add payment_status enum (if not exists)
DO $$ BEGIN
    CREATE TYPE "public"."payment_status" AS ENUM('pending', 'partial', 'paid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Add payment_registered to activity_type if not exists
DO $$ BEGIN
    ALTER TYPE "public"."activity_type" ADD VALUE IF NOT EXISTS 'payment_registered';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Create contacts table
CREATE TABLE IF NOT EXISTS "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"instagram_handle" text,
	"role" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Add client_type to clients
DO $$ BEGIN
    ALTER TABLE "clients" ADD COLUMN "client_type" "client_type" DEFAULT 'individual' NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint

-- Add contact_id to orders
DO $$ BEGIN
    ALTER TABLE "orders" ADD COLUMN "contact_id" uuid;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint

-- Add payment fields to orders (if not exist)
DO $$ BEGIN
    ALTER TABLE "orders" ADD COLUMN "payment_status" "payment_status" DEFAULT 'pending' NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "orders" ADD COLUMN "payment_amount" numeric(10, 2);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "orders" ADD COLUMN "receipt_url" text;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "orders" ADD COLUMN "paid_at" timestamp;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint

-- Add foreign keys
DO $$ BEGIN
    ALTER TABLE "contacts" ADD CONSTRAINT "contacts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "orders" ADD CONSTRAINT "orders_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
