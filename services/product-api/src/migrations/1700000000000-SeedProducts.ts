import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedProducts1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sku VARCHAR NOT NULL UNIQUE,
        name VARCHAR NOT NULL,
        description TEXT DEFAULT '',
        price NUMERIC(12,2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        last_modified_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      INSERT INTO products (id, sku, name, description, price, stock) VALUES
      (
        'a1b2c3d4-e5f6-4a1b-8c2d-1a2b3c4d5e01',
        'LAPTOP-PRO-15',
        'ProBook Laptop 15"',
        'High-performance laptop with 16GB RAM and 512GB SSD.',
        1299.99,
        50
      ),
      (
        'a1b2c3d4-e5f6-4a1b-8c2d-1a2b3c4d5e02',
        'MOUSE-ERGO-X',
        'ErgoMouse X',
        'Ergonomic wireless mouse with adjustable DPI.',
        49.99,
        100
      ),
      (
        'a1b2c3d4-e5f6-4a1b-8c2d-1a2b3c4d5e03',
        'MONITOR-4K-27',
        'UltraView 27" 4K Monitor',
        '27-inch 4K IPS monitor with HDR support.',
        599.99,
        25
      ),
      (
        'a1b2c3d4-e5f6-4a1b-8c2d-1a2b3c4d5e04',
        'KEYBOARD-MECH-R',
        'MechType Red',
        'Mechanical keyboard with red switches and RGB lighting.',
        129.99,
        75
      ),
      (
        'a1b2c3d4-e5f6-4a1b-8c2d-1a2b3c4d5e05',
        'HEADSET-NC-700',
        'SoundPro NC700 Headset',
        'Noise-cancelling wireless headset with 30hr battery.',
        249.99,
        40
      )
      ON CONFLICT (id) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS products');
  }
}
