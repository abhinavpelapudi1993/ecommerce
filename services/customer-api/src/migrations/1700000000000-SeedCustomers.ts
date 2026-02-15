import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedCustomers1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        email VARCHAR NOT NULL UNIQUE,
        billing_address JSONB NOT NULL,
        shipping_address JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        last_modified_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Seed data — same 3 customers as previous mock
    await queryRunner.query(`
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
      ON CONFLICT (id) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS customers');
  }
}
