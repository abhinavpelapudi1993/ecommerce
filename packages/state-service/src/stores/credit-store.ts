import { create } from 'zustand';
import type { ServiceContainer } from '../types';
import type { CreditLedgerEntry } from '@ecommerce/data-client';

interface CreditState {
  balance: number | null;
  ledger: CreditLedgerEntry[];
  loading: boolean;
  error: string | null;
  fetchBalance: (customerId: string) => Promise<void>;
  grantCredit: (customerId: string, amount: number, reason: string) => Promise<void>;
  deductCredit: (customerId: string, amount: number, reason: string) => Promise<void>;
  reset: () => void;
}

export function createCreditStore(services: ServiceContainer) {
  return create<CreditState>((set) => ({
    balance: null,
    ledger: [],
    loading: false,
    error: null,

    fetchBalance: async (customerId: string) => {
      set({ loading: true, error: null });
      try {
        const res = await services.creditClient.getBalance(customerId);
        set({ balance: res.balance, ledger: res.ledger, loading: false });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch balance';
        set({ error: message, loading: false });
      }
    },

    grantCredit: async (customerId: string, amount: number, reason: string) => {
      set({ loading: true, error: null });
      try {
        const res = await services.creditClient.grantCredit(customerId, { amount, reason });
        set({ balance: res.balance, ledger: res.ledger, loading: false });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to grant credit';
        set({ error: message, loading: false });
      }
    },

    deductCredit: async (customerId: string, amount: number, reason: string) => {
      set({ loading: true, error: null });
      try {
        const res = await services.creditClient.deductCredit(customerId, { amount, reason });
        set({ balance: res.balance, ledger: res.ledger, loading: false });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to deduct credit';
        set({ error: message, loading: false });
      }
    },

    reset: () => set({ balance: null, ledger: [], loading: false, error: null }),
  }));
}
