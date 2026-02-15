import { MigrationInterface, QueryRunner } from 'typeorm';

export class PurchaseLifecycle1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Support users table — company employees, separate from customers
    await queryRunner.query(`
      CREATE TABLE support_users (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(255) NOT NULL,
        email       VARCHAR(255) NOT NULL UNIQUE,
        role        VARCHAR(20) NOT NULL DEFAULT 'support'
                    CHECK (role IN ('support', 'admin')),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Seed support users
    await queryRunner.query(`
      INSERT INTO support_users (id, name, email, role) VALUES
      ('d0a80001-0000-4000-8000-000000000001', 'Sarah Support', 'sarah@company.com', 'support'),
      ('d0a80001-0000-4000-8000-000000000002', 'Mike Manager', 'mike@company.com', 'admin'),
      ('d0a80001-0000-4000-8000-000000000003', 'Lisa Lead', 'lisa@company.com', 'support')
      ON CONFLICT (id) DO NOTHING
    `);

    // Transactions table — audit trail for purchase lifecycle
    await queryRunner.query(`
      CREATE TABLE transactions (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        purchase_id   UUID NOT NULL REFERENCES purchases(id),
        customer_id   VARCHAR(255) NOT NULL,
        type          VARCHAR(30) NOT NULL
                      CHECK (type IN ('order_placed', 'shipment_delivered', 'refund')),
        amount        NUMERIC(12,2) NOT NULL,
        status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'completed')),
        description   TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_transactions_purchase ON transactions(purchase_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_transactions_customer ON transactions(customer_id)
    `);

    // Company ledger — append-only, tracks company revenue
    await queryRunner.query(`
      CREATE TABLE company_ledger (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        amount        NUMERIC(12,2) NOT NULL,
        type          VARCHAR(20) NOT NULL
                      CHECK (type IN ('sale', 'refund')),
        reference_id  UUID,
        reason        TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_company_ledger_reference ON company_ledger(reference_id)
    `);

    // Refund requests table
    await queryRunner.query(`
      CREATE TABLE refund_requests (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        purchase_id       UUID NOT NULL REFERENCES purchases(id),
        customer_id       VARCHAR(255) NOT NULL,
        reason            TEXT NOT NULL,
        requested_amount  NUMERIC(12,2),
        approved_amount   NUMERIC(12,2),
        status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'approved', 'rejected')),
        reviewer_note     TEXT,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_refund_requests_purchase ON refund_requests(purchase_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_refund_requests_customer ON refund_requests(customer_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_refund_requests_status ON refund_requests(status)
    `);

    // Update purchases status constraint to include new statuses
    await queryRunner.query(`
      ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_status_check
    `);
    await queryRunner.query(`
      ALTER TABLE purchases ADD CONSTRAINT purchases_status_check
        CHECK (status IN ('pending', 'settled', 'partially_refunded', 'refunded'))
    `);

    // Update existing 'completed' purchases to 'settled'
    await queryRunner.query(`
      UPDATE purchases SET status = 'settled' WHERE status = 'completed'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS refund_requests');
    await queryRunner.query('DROP TABLE IF EXISTS company_ledger');
    await queryRunner.query('DROP TABLE IF EXISTS transactions');
    await queryRunner.query('DROP TABLE IF EXISTS support_users');

    // Revert purchases status constraint
    await queryRunner.query(`
      ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_status_check
    `);
    await queryRunner.query(`
      ALTER TABLE purchases ADD CONSTRAINT purchases_status_check
        CHECK (status IN ('completed', 'partially_refunded', 'refunded'))
    `);
    await queryRunner.query(`
      UPDATE purchases SET status = 'completed' WHERE status = 'settled'
    `);
  }
}
