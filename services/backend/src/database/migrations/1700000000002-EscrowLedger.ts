import { MigrationInterface, QueryRunner } from 'typeorm';

export class EscrowLedger1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing CHECK constraint on company_ledger.type
    await queryRunner.query(`
      ALTER TABLE company_ledger
      DROP CONSTRAINT IF EXISTS company_ledger_type_check
    `);

    // Add updated CHECK constraint with escrow types
    await queryRunner.query(`
      ALTER TABLE company_ledger
      ADD CONSTRAINT company_ledger_type_check
      CHECK (type IN ('sale', 'refund', 'escrow', 'escrow_release'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE company_ledger
      DROP CONSTRAINT IF EXISTS company_ledger_type_check
    `);

    await queryRunner.query(`
      ALTER TABLE company_ledger
      ADD CONSTRAINT company_ledger_type_check
      CHECK (type IN ('sale', 'refund'))
    `);
  }
}
