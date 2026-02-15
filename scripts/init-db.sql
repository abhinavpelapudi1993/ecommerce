-- ============================================================
-- E-Commerce Platform — Database Initialization & Seed Script
-- ============================================================
-- This script runs once when the PostgreSQL container is first
-- created (via /docker-entrypoint-initdb.d/). It creates all
-- tables and seeds mock data so services can skip migrations
-- during Docker-based development.
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- 1. CUSTOMERS  (managed by customer-api, port 3001)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR NOT NULL,
  email             VARCHAR NOT NULL UNIQUE,
  billing_address   JSONB NOT NULL,
  shipping_address  JSONB NOT NULL,
  created_at        TIMESTAMP DEFAULT NOW(),
  last_modified_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO customers (id, name, email, billing_address, shipping_address) VALUES
(
  'c0a80001-0000-4000-8000-000000000001',
  'Alice Johnson',
  'alice@example.com',
  '{"line1":"123 Billing St","line2":"Apt 4B","city":"New York","postalCode":"10001","state":"NY","country":"US"}',
  '{"line1":"456 Shipping Ave","city":"New York","postalCode":"10002","state":"NY","country":"US"}'
),
(
  'c0a80001-0000-4000-8000-000000000002',
  'Bob Smith',
  'bob@example.com',
  '{"line1":"789 Oak Lane","city":"San Francisco","postalCode":"94102","state":"CA","country":"US"}',
  '{"line1":"789 Oak Lane","city":"San Francisco","postalCode":"94102","state":"CA","country":"US"}'
),
(
  'c0a80001-0000-4000-8000-000000000003',
  'Carol Davis',
  'carol@example.com',
  '{"line1":"321 Pine Rd","line2":"Suite 100","city":"Austin","postalCode":"73301","state":"TX","country":"US"}',
  '{"line1":"654 Elm Blvd","city":"Austin","postalCode":"73301","state":"TX","country":"US"}'
)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 2. PRODUCTS  (managed by product-api, port 3002)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku               VARCHAR NOT NULL UNIQUE,
  name              VARCHAR NOT NULL,
  description       TEXT DEFAULT '',
  price             NUMERIC(12,2) NOT NULL,
  stock             INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMP DEFAULT NOW(),
  last_modified_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO products (id, sku, name, description, price, stock) VALUES
(
  'a1b2c3d4-e5f6-4a1b-8c2d-1a2b3c4d5e01',
  'LAPTOP-PRO-15',
  'ProBook Laptop 15"',
  'High-performance laptop with 16GB RAM and 512GB SSD.',
  1299.99, 50
),
(
  'a1b2c3d4-e5f6-4a1b-8c2d-1a2b3c4d5e02',
  'MOUSE-ERGO-X',
  'ErgoMouse X',
  'Ergonomic wireless mouse with adjustable DPI.',
  49.99, 100
),
(
  'a1b2c3d4-e5f6-4a1b-8c2d-1a2b3c4d5e03',
  'MONITOR-4K-27',
  'UltraView 27" 4K Monitor',
  '27-inch 4K IPS monitor with HDR support.',
  599.99, 25
),
(
  'a1b2c3d4-e5f6-4a1b-8c2d-1a2b3c4d5e04',
  'KEYBOARD-MECH-R',
  'MechType Red',
  'Mechanical keyboard with red switches and RGB lighting.',
  129.99, 75
),
(
  'a1b2c3d4-e5f6-4a1b-8c2d-1a2b3c4d5e05',
  'HEADSET-NC-700',
  'SoundPro NC700 Headset',
  'Noise-cancelling wireless headset with 30hr battery.',
  249.99, 40
)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 3. SHIPMENTS  (managed by shipment-api, port 3003)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status            VARCHAR NOT NULL DEFAULT 'processing',
  tracking_number   VARCHAR NOT NULL,
  shipping_address  JSONB NOT NULL,
  products          JSONB NOT NULL,
  created_at        TIMESTAMP DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 4. CREDIT LEDGER  (managed by backend, port 3000)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     VARCHAR(255) NOT NULL,
  amount          NUMERIC(12,2) NOT NULL,
  type            VARCHAR(20) NOT NULL
                  CHECK (type IN ('grant', 'deduct', 'purchase', 'refund')),
  reason          TEXT,
  reference_id    UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_customer ON credit_ledger(customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_reference ON credit_ledger(reference_id);

-- Seed initial credit for demo customers
INSERT INTO credit_ledger (id, customer_id, amount, type, reason) VALUES
(
  'e0a80001-0000-4000-8000-000000000001',
  'c0a80001-0000-4000-8000-000000000001',
  5000.00, 'grant', 'Welcome bonus — Alice'
),
(
  'e0a80001-0000-4000-8000-000000000002',
  'c0a80001-0000-4000-8000-000000000002',
  2500.00, 'grant', 'Welcome bonus — Bob'
),
(
  'e0a80001-0000-4000-8000-000000000003',
  'c0a80001-0000-4000-8000-000000000003',
  1000.00, 'grant', 'Welcome bonus — Carol'
)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 5. PURCHASES  (managed by backend)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         VARCHAR(255) NOT NULL,
  product_id          VARCHAR(255) NOT NULL,
  product_sku         VARCHAR(255) NOT NULL,
  product_name        VARCHAR(500) NOT NULL,
  quantity            INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_at_purchase   NUMERIC(12,2) NOT NULL,
  total_amount        NUMERIC(12,2) NOT NULL,
  discount_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  promo_code_id       UUID,
  shipment_id         VARCHAR(255),
  status              VARCHAR(30) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'settled', 'partially_refunded', 'refunded', 'settlement_failed', 'refund_failed', 'cancelled')),
  error_message       TEXT,
  refunded_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  settled_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_customer ON purchases(customer_id);

-- ────────────────────────────────────────────────────────────
-- 6. PROMO CODES  (managed by backend)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(50) NOT NULL UNIQUE,
  discount_type   VARCHAR(20) NOT NULL
                  CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value  NUMERIC(12,2) NOT NULL CHECK (discount_value > 0),
  max_uses        INTEGER,
  current_uses    INTEGER NOT NULL DEFAULT 0,
  min_purchase    NUMERIC(12,2) DEFAULT 0,
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promo_usages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id   UUID NOT NULL REFERENCES promo_codes(id),
  customer_id     VARCHAR(255) NOT NULL,
  purchase_id     UUID NOT NULL REFERENCES purchases(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed demo promo codes
INSERT INTO promo_codes (id, code, discount_type, discount_value, max_uses, min_purchase, is_active) VALUES
(
  'f0a80001-0000-4000-8000-000000000001',
  'WELCOME10', 'percentage', 10.00, 100, 50.00, true
),
(
  'f0a80001-0000-4000-8000-000000000002',
  'SAVE20', 'fixed', 20.00, 50, 100.00, true
),
(
  'f0a80001-0000-4000-8000-000000000003',
  'HALF50', 'percentage', 50.00, 10, 200.00, true
)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 7. SUPPORT USERS  (managed by backend)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  role        VARCHAR(20) NOT NULL DEFAULT 'support'
              CHECK (role IN ('support', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO support_users (id, name, email, role) VALUES
('d0a80001-0000-4000-8000-000000000001', 'Sarah Support', 'sarah@company.com', 'support'),
('d0a80001-0000-4000-8000-000000000002', 'Mike Manager',  'mike@company.com',  'admin'),
('d0a80001-0000-4000-8000-000000000003', 'Lisa Lead',     'lisa@company.com',   'support')
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 8. TRANSACTIONS  (audit trail — managed by backend)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id   UUID NOT NULL REFERENCES purchases(id),
  customer_id   VARCHAR(255) NOT NULL,
  type          VARCHAR(30) NOT NULL
                CHECK (type IN ('order_placed', 'shipment_delivered', 'refund', 'settlement_failed', 'refund_failed', 'order_cancelled')),
  amount        NUMERIC(12,2) NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'completed', 'failed')),
  description   TEXT,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_purchase ON transactions(purchase_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);

-- ────────────────────────────────────────────────────────────
-- 9. COMPANY LEDGER  (append-only — managed by backend)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_ledger (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount        NUMERIC(12,2) NOT NULL,
  type          VARCHAR(20) NOT NULL
                CHECK (type IN ('sale', 'refund', 'escrow', 'escrow_release')),
  reference_id  UUID,
  reason        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_ledger_reference ON company_ledger(reference_id);

-- ────────────────────────────────────────────────────────────
-- 10. REFUND REQUESTS  (managed by backend)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refund_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id       UUID NOT NULL REFERENCES purchases(id),
  customer_id       VARCHAR(255) NOT NULL,
  type              VARCHAR(20) NOT NULL DEFAULT 'refund',
  reason            TEXT NOT NULL,
  requested_amount  NUMERIC(12,2),
  approved_amount   NUMERIC(12,2),
  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'failed')),
  reviewer_note     TEXT,
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refund_requests_purchase ON refund_requests(purchase_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_customer ON refund_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);

-- ────────────────────────────────────────────────────────────
-- 11. IDEMPOTENCY KEYS  (managed by backend)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key         VARCHAR(255) PRIMARY KEY,
  response    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires ON idempotency_keys(expires_at);

-- ────────────────────────────────────────────────────────────
-- 12. TypeORM migration tracking tables
-- ────────────────────────────────────────────────────────────
-- Mark all migrations as already run so TypeORM doesn't
-- attempt to re-run them on service startup.

CREATE TABLE IF NOT EXISTS migrations (
  id        SERIAL PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  name      VARCHAR NOT NULL
);

INSERT INTO migrations (timestamp, name) VALUES
(1700000000000, 'SeedCustomers1700000000000'),
(1700000000000, 'SeedProducts1700000000000'),
(1700000000000, 'CreateShipments1700000000000'),
(1700000000000, 'InitialSchema1700000000000'),
(1700000000001, 'PurchaseLifecycle1700000000001')
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================
-- Summary of seeded data:
--   3 Customers: Alice ($5000 credit), Bob ($2500), Carol ($1000)
--   5 Products:  Laptop, Mouse, Monitor, Keyboard, Headset
--   3 Support Users: Sarah (support), Mike (admin), Lisa (support)
--   3 Promo Codes: WELCOME10 (10%), SAVE20 ($20 off), HALF50 (50%)
-- ============================================================
