import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE credit_ledger (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id     VARCHAR(255) NOT NULL,
        amount          NUMERIC(12,2) NOT NULL,
        type            VARCHAR(20) NOT NULL
                        CHECK (type IN ('grant', 'deduct', 'purchase', 'refund')),
        reason          TEXT,
        reference_id    UUID,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_credit_ledger_customer ON credit_ledger(customer_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_credit_ledger_reference ON credit_ledger(reference_id)
    `);

    await queryRunner.query(`
      CREATE TABLE purchases (
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
        status              VARCHAR(20) NOT NULL DEFAULT 'completed'
                            CHECK (status IN ('completed', 'partially_refunded', 'refunded')),
        refunded_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_purchases_customer ON purchases(customer_id)
    `);

    await queryRunner.query(`
      CREATE TABLE promo_codes (
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
      )
    `);

    await queryRunner.query(`
      CREATE TABLE promo_usages (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        promo_code_id   UUID NOT NULL REFERENCES promo_codes(id),
        customer_id     VARCHAR(255) NOT NULL,
        purchase_id     UUID NOT NULL REFERENCES purchases(id),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS promo_usages');
    await queryRunner.query('DROP TABLE IF EXISTS promo_codes');
    await queryRunner.query('DROP TABLE IF EXISTS purchases');
    await queryRunner.query('DROP TABLE IF EXISTS credit_ledger');
  }
}
