import type { Product } from '@ecommerce/data-client';

export const mockProducts: Product[] = [
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-1a2b3c4d5e01',
    sku: 'LAPTOP-PRO-15',
    name: 'ProBook Laptop 15"',
    description: 'High-performance laptop with 16GB RAM and 512GB SSD.',
    price: 1299.99,
    createdAt: Date.now() - 86400000 * 90,
    lastModifiedAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-1a2b3c4d5e02',
    sku: 'MOUSE-ERGO-X',
    name: 'ErgoMouse X',
    description: 'Ergonomic wireless mouse with adjustable DPI.',
    price: 49.99,
    createdAt: Date.now() - 86400000 * 60,
    lastModifiedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'a1b2c3d4-e5f6-4a1b-8c2d-1a2b3c4d5e03',
    sku: 'MONITOR-4K-27',
    name: 'UltraView 27" 4K Monitor',
    description: '27-inch 4K IPS monitor with HDR support.',
    price: 599.99,
    createdAt: Date.now() - 86400000 * 45,
    lastModifiedAt: Date.now() - 86400000 * 7,
  },
];
