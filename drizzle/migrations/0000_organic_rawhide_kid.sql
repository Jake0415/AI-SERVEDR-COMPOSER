CREATE SCHEMA IF NOT EXISTS "ai_server_composer";
--> statement-breakpoint
CREATE TABLE "ai_server_composer"."actual_sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actual_sale_id" uuid NOT NULL,
	"quotation_item_id" uuid,
	"change_type" text DEFAULT 'unchanged' NOT NULL,
	"item_name" text NOT NULL,
	"item_spec" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit" text DEFAULT 'EA' NOT NULL,
	"unit_cost_price" bigint DEFAULT 0 NOT NULL,
	"unit_supply_price" bigint DEFAULT 0 NOT NULL,
	"amount" bigint DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_server_composer"."actual_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"quotation_id" uuid NOT NULL,
	"contract_number" text,
	"contract_date" date,
	"delivery_date" date,
	"total_cost" bigint DEFAULT 0 NOT NULL,
	"total_supply" bigint DEFAULT 0 NOT NULL,
	"total_amount" bigint DEFAULT 0 NOT NULL,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_server_composer"."audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"action_type" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" uuid,
	"changes" jsonb,
	"ip_address" "inet",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_server_composer"."bid_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"result" text NOT NULL,
	"reason" text,
	"competitor_price" bigint,
	"recorded_by" uuid NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_server_composer"."customer_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"name" text NOT NULL,
	"department" text,
	"position" text,
	"phone" text,
	"mobile" text,
	"email" text,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_server_composer"."customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_name" text NOT NULL,
	"business_number" text,
	"ceo_name" text,
	"address" text,
	"business_type" text,
	"business_item" text,
	"phone" text,
	"fax" text,
	"email" text,
	"customer_type" text DEFAULT 'private' NOT NULL,
	"payment_terms" text,
	"notes" text,
	"is_frequent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_server_composer"."excel_upload_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"file_name" text NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"success_rows" integer DEFAULT 0 NOT NULL,
	"failed_rows" integer DEFAULT 0 NOT NULL,
	"error_details" jsonb,
	"status" text DEFAULT 'processing' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_server_composer"."notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"related_resource_type" text,
	"related_resource_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_server_composer"."part_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"group" text NOT NULL,
	"spec_fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_server_composer"."part_price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"part_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"change_type" text NOT NULL,
	"list_price_before" bigint,
	"list_price_after" bigint NOT NULL,
	"market_price_before" bigint,
	"market_price_after" bigint NOT NULL,
	"cost_price_before" bigint,
	"cost_price_after" bigint NOT NULL,
	"supply_price_before" bigint,
	"supply_price_after" bigint NOT NULL,
	"changed_by" uuid NOT NULL,
	"change_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_server_composer"."part_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"part_id" uuid NOT NULL,
	"list_price" bigint DEFAULT 0 NOT NULL,
	"market_price" bigint DEFAULT 0 NOT NULL,
	"cost_price_encrypted" "bytea",
	"supply_price" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_server_composer"."parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"model_name" text NOT NULL,
	"manufacturer" text NOT NULL,
	"specs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_server_composer"."price_snapshot_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"snapshot_hour" integer DEFAULT 9 NOT NULL,
	"retention_months" integer DEFAULT 12 NOT NULL,
	"last_snapshot_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_server_composer"."price_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"snapshot_date" date NOT NULL,
	"snapshot_data" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"part_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_server_composer"."quotation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"item_type" text DEFAULT 'hardware' NOT NULL,
	"part_id" uuid,
	"item_name" text NOT NULL,
	"item_spec" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit" text DEFAULT 'EA' NOT NULL,
	"unit_cost_price" bigint DEFAULT 0 NOT NULL,
	"unit_supply_price" bigint DEFAULT 0 NOT NULL,
	"amount" bigint DEFAULT 0 NOT NULL,
	"margin_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_server_composer"."quotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"rfp_id" uuid,
	"customer_id" uuid NOT NULL,
	"quotation_number" text NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"parent_quotation_id" uuid,
	"quotation_type" text NOT NULL,
	"total_cost" bigint DEFAULT 0 NOT NULL,
	"total_supply" bigint DEFAULT 0 NOT NULL,
	"vat" bigint DEFAULT 0 NOT NULL,
	"total_amount" bigint DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"validity_date" date NOT NULL,
	"delivery_terms" text,
	"delivery_date" date,
	"payment_terms" text,
	"notes" text,
	"created_by" uuid NOT NULL,
	"approved_by" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_server_composer"."rfp_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"status" text DEFAULT 'uploaded' NOT NULL,
	"parsed_requirements" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_server_composer"."tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"business_number" text NOT NULL,
	"ceo_name" text NOT NULL,
	"address" text NOT NULL,
	"business_type" text NOT NULL,
	"business_item" text NOT NULL,
	"phone" text NOT NULL,
	"fax" text,
	"email" text NOT NULL,
	"logo_url" text,
	"seal_url" text,
	"bank_name" text,
	"bank_account" text,
	"bank_holder" text,
	"default_validity_days" integer DEFAULT 30 NOT NULL,
	"default_payment_terms" text,
	"quotation_prefix" text DEFAULT 'Q' NOT NULL,
	"plan_type" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_server_composer"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"department" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_server_composer"."actual_sale_items" ADD CONSTRAINT "actual_sale_items_actual_sale_id_actual_sales_id_fk" FOREIGN KEY ("actual_sale_id") REFERENCES "ai_server_composer"."actual_sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."actual_sale_items" ADD CONSTRAINT "actual_sale_items_quotation_item_id_quotation_items_id_fk" FOREIGN KEY ("quotation_item_id") REFERENCES "ai_server_composer"."quotation_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."actual_sales" ADD CONSTRAINT "actual_sales_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_server_composer"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."actual_sales" ADD CONSTRAINT "actual_sales_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "ai_server_composer"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."actual_sales" ADD CONSTRAINT "actual_sales_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "ai_server_composer"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_server_composer"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "ai_server_composer"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."bid_results" ADD CONSTRAINT "bid_results_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "ai_server_composer"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."bid_results" ADD CONSTRAINT "bid_results_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "ai_server_composer"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."customer_contacts" ADD CONSTRAINT "customer_contacts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "ai_server_composer"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_server_composer"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."excel_upload_logs" ADD CONSTRAINT "excel_upload_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_server_composer"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."excel_upload_logs" ADD CONSTRAINT "excel_upload_logs_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "ai_server_composer"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."notifications" ADD CONSTRAINT "notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_server_composer"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "ai_server_composer"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."part_categories" ADD CONSTRAINT "part_categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_server_composer"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."part_price_history" ADD CONSTRAINT "part_price_history_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "ai_server_composer"."parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."part_price_history" ADD CONSTRAINT "part_price_history_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_server_composer"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."part_price_history" ADD CONSTRAINT "part_price_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "ai_server_composer"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."part_prices" ADD CONSTRAINT "part_prices_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "ai_server_composer"."parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."parts" ADD CONSTRAINT "parts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_server_composer"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."parts" ADD CONSTRAINT "parts_category_id_part_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "ai_server_composer"."part_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."price_snapshot_settings" ADD CONSTRAINT "price_snapshot_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_server_composer"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."price_snapshots" ADD CONSTRAINT "price_snapshots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_server_composer"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "ai_server_composer"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."quotation_items" ADD CONSTRAINT "quotation_items_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "ai_server_composer"."parts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."quotations" ADD CONSTRAINT "quotations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_server_composer"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."quotations" ADD CONSTRAINT "quotations_rfp_id_rfp_documents_id_fk" FOREIGN KEY ("rfp_id") REFERENCES "ai_server_composer"."rfp_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."quotations" ADD CONSTRAINT "quotations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "ai_server_composer"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."quotations" ADD CONSTRAINT "quotations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "ai_server_composer"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."quotations" ADD CONSTRAINT "quotations_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "ai_server_composer"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."rfp_documents" ADD CONSTRAINT "rfp_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_server_composer"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."rfp_documents" ADD CONSTRAINT "rfp_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "ai_server_composer"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_server_composer"."users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "ai_server_composer"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_actual_sale_items_sale" ON "ai_server_composer"."actual_sale_items" USING btree ("actual_sale_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_actual_sales_quotation" ON "ai_server_composer"."actual_sales" USING btree ("quotation_id");--> statement-breakpoint
CREATE INDEX "idx_actual_sales_tenant" ON "ai_server_composer"."actual_sales" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_tenant" ON "ai_server_composer"."audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created" ON "ai_server_composer"."audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_customer_contacts_customer" ON "ai_server_composer"."customer_contacts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_customers_tenant" ON "ai_server_composer"."customers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user" ON "ai_server_composer"."notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_part_categories_tenant" ON "ai_server_composer"."part_categories" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_part_categories_unique" ON "ai_server_composer"."part_categories" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "idx_price_history_part" ON "ai_server_composer"."part_price_history" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "idx_price_history_tenant" ON "ai_server_composer"."part_price_history" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_part_prices_part" ON "ai_server_composer"."part_prices" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "idx_parts_tenant" ON "ai_server_composer"."parts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_parts_category" ON "ai_server_composer"."parts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_parts_model" ON "ai_server_composer"."parts" USING btree ("model_name");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_snapshot_settings_tenant" ON "ai_server_composer"."price_snapshot_settings" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_price_snapshots_unique" ON "ai_server_composer"."price_snapshots" USING btree ("tenant_id","snapshot_date");--> statement-breakpoint
CREATE INDEX "idx_quotation_items_quotation" ON "ai_server_composer"."quotation_items" USING btree ("quotation_id");--> statement-breakpoint
CREATE INDEX "idx_quotations_tenant" ON "ai_server_composer"."quotations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_quotations_customer" ON "ai_server_composer"."quotations" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_quotations_unique" ON "ai_server_composer"."quotations" USING btree ("tenant_id","quotation_number","revision");--> statement-breakpoint
CREATE INDEX "idx_rfp_tenant" ON "ai_server_composer"."rfp_documents" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_users_tenant" ON "ai_server_composer"."users" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_email" ON "ai_server_composer"."users" USING btree ("email");