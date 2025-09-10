-- Commun Printing - Initial Schema
-- Migration: 001
-- Description: Sets up the initial tables for the platform.

-- User roles enum
CREATE TYPE user_role AS ENUM ('customer', 'owner', 'admin');

-- Printer status enum
CREATE TYPE printer_status AS ENUM ('available', 'printing', 'maintenance', 'offline');

-- Model analysis status enum
CREATE TYPE analysis_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Order status enum
CREATE TYPE order_status AS ENUM ('draft', 'pending_payment', 'paid', 'assigned', 'printing', 'postprocessing', 'shipped', 'delivered', 'cancelled', 'refunded');

-- Order item type enum
CREATE TYPE order_item_type AS ENUM ('print', 'product', 'fee');

-- Payout status enum
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'paid', 'failed');


-- Users table
CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" user_role NOT NULL DEFAULT 'customer',
  "referral_code" VARCHAR(20) UNIQUE,
  "referred_by_id" UUID REFERENCES "users"("id"),
  "stripe_customer_id" VARCHAR(255),
  "stripe_connect_id" VARCHAR(255),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_email ON "users" ("email");
CREATE INDEX idx_users_referral_code ON "users" ("referral_code");


-- Printers table
CREATE TABLE "printers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" UUID NOT NULL REFERENCES "users"("id"),
  "name" VARCHAR(255) NOT NULL,
  "brand" VARCHAR(100),
  "model" VARCHAR(100),
  "photos" JSONB, -- array of s3 keys
  "max_volume_mm" JSONB NOT NULL, -- { x: number, y: number, z: number }
  "materials" JSONB NOT NULL, -- array of supported material keys (e.g., ['pla', 'petg'])
  "multicolor" BOOLEAN DEFAULT false,
  "quality_score" NUMERIC(3, 2) DEFAULT 4.0,
  "status" printer_status NOT NULL DEFAULT 'offline',
  "default_rate_per_hour_eur" NUMERIC(10, 2) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_printers_owner_id ON "printers" ("owner_id");
CREATE INDEX idx_printers_status ON "printers" ("status");


-- Models table (3D uploads)
CREATE TABLE "models" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id"),
  "filename" VARCHAR(255) NOT NULL,
  "s3_key" VARCHAR(1024) UNIQUE NOT NULL,
  "file_type" VARCHAR(10) NOT NULL, -- e.g., 'stl', 'obj', 'glb'
  "volume_cm3" NUMERIC(12, 4),
  "bbox_mm" JSONB, -- { x: number, y: number, z: number }
  "analysis_status" analysis_status NOT NULL DEFAULT 'pending',
  "analysis_results" JSONB, -- detailed analysis data
  "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_models_user_id ON "models" ("user_id");


-- Orders table
CREATE TABLE "orders" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id"),
  "total_cents" INTEGER NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
  "status" order_status NOT NULL DEFAULT 'draft',
  "shipping_details" JSONB,
  "billing_details" JSONB,
  "stripe_payment_intent_id" VARCHAR(255),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_user_id ON "orders" ("user_id");
CREATE INDEX idx_orders_status ON "orders" ("status");


-- Order Items table
CREATE TABLE "order_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "model_id" UUID REFERENCES "models"("id"),
  "type" order_item_type NOT NULL,
  "description" TEXT,
  "selected_printer_id" UUID REFERENCES "printers"("id"),
  "settings" JSONB, -- { material, quality, supports, postprocess }
  "price_breakdown" JSONB, -- { material_cost, print_time_cost, postprocess_cost, platform_fee }
  "price_cents" INTEGER NOT NULL
);
CREATE INDEX idx_order_items_order_id ON "order_items" ("order_id");
CREATE INDEX idx_order_items_model_id ON "order_items" ("model_id");


-- Payouts table
CREATE TABLE "payouts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" UUID NOT NULL REFERENCES "users"("id"),
  "amount_cents" INTEGER NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'EUR',
  "status" payout_status NOT NULL DEFAULT 'pending',
  "period_start" TIMESTAMPTZ NOT NULL,
  "period_end" TIMESTAMPTZ NOT NULL,
  "external_payout_id" VARCHAR(255), -- e.g., Stripe Payout ID
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payouts_owner_id ON "payouts" ("owner_id");
CREATE INDEX idx_payouts_status ON "payouts" ("status");


-- Transactions table (for commissions and fees)
CREATE TABLE "transactions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_item_id" UUID NOT NULL REFERENCES "order_items"("id"),
  "payout_id" UUID REFERENCES "payouts"("id"),
  "owner_id" UUID NOT NULL REFERENCES "users"("id"),
  "type" VARCHAR(50) NOT NULL, -- 'commission', 'referral_bonus', 'platform_fee'
  "amount_cents" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_transactions_order_item_id ON "transactions" ("order_item_id");
CREATE INDEX idx_transactions_owner_id ON "transactions" ("owner_id");


-- Audit Logs
CREATE TABLE "audit_logs" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" UUID REFERENCES "users"("id"),
  "action" VARCHAR(255) NOT NULL,
  "target_entity" VARCHAR(100),
  "target_id" VARCHAR(255),
  "details" JSONB,
  "ip_address" VARCHAR(45),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_user_id ON "audit_logs" ("user_id");
CREATE INDEX idx_audit_logs_target_entity_id ON "audit_logs" ("target_entity", "target_id");
