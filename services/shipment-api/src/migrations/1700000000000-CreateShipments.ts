import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShipments1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        status VARCHAR NOT NULL DEFAULT 'processing',
        tracking_number VARCHAR NOT NULL,
        shipping_address JSONB NOT NULL,
        products JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS shipments');
  }
}
