import type { Customer } from '@ecommerce/data-client';

export const mockCustomers: Customer[] = [
  {
    id: 'c0a80001-0000-4000-8000-000000000001',
    name: 'Alice Johnson',
    billingAddress: {
      line1: '123 Billing St',
      line2: 'Apt 4B',
      city: 'New York',
      postalCode: '10001',
      state: 'NY',
      country: 'US',
    },
    shippingAddress: {
      line1: '456 Shipping Ave',
      city: 'New York',
      postalCode: '10002',
      state: 'NY',
      country: 'US',
    },
    email: 'alice@example.com',
    createdAt: Date.now() - 86400000 * 30,
    lastModifiedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'c0a80001-0000-4000-8000-000000000002',
    name: 'Bob Smith',
    billingAddress: {
      line1: '789 Oak Lane',
      city: 'San Francisco',
      postalCode: '94102',
      state: 'CA',
      country: 'US',
    },
    shippingAddress: {
      line1: '789 Oak Lane',
      city: 'San Francisco',
      postalCode: '94102',
      state: 'CA',
      country: 'US',
    },
    email: 'bob@example.com',
    createdAt: Date.now() - 86400000 * 60,
    lastModifiedAt: Date.now() - 86400000 * 5,
  },
];
