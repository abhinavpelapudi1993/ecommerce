import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefundRequestType1700000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'refund'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE refund_requests DROP COLUMN IF EXISTS type`,
    );
  }
}
