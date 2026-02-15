import type { CreditLedgerEntry } from '@ecommerce/data-client';

export const mockLedger: CreditLedgerEntry[] = [
  {
    id: 'led-1',
    amount: 500,
    type: 'grant',
    reason: 'Welcome bonus',
    referenceId: null,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'led-2',
    amount: -99.98,
    type: 'purchase',
    reason: 'Purchase of 2x ErgoMouse X',
    referenceId: 'pur-001',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'led-3',
    amount: -1169.99,
    type: 'purchase',
    reason: 'Purchase of 1x ProBook Laptop 15"',
    referenceId: 'pur-002',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'led-4',
    amount: 200,
    type: 'refund',
    reason: 'Partial refund for laptop',
    referenceId: 'pur-002',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'led-5',
    amount: 1000,
    type: 'grant',
    reason: 'Loyalty reward',
    referenceId: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];
