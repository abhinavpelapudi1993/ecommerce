import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettledAt1700000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE purchases DROP COLUMN IF EXISTS settled_at`,
    );
  }
}
