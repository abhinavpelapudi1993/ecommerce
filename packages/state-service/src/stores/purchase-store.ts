import { create } from 'zustand';
import type { ServiceContainer } from '../types';
import type { Purchase, Address } from '@ecommerce/data-client';

interface PurchaseState {
  purchases: Purchase[];
  total: number;
  page: number;
  loading: boolean;
  error: string | null;
  fetchPurchases: (customerId: string, page?: number) => Promise<void>;
  createPurchase: (
    customerId: string,
    productId: string,
    quantity: number,
    promoCode?: string,
    shippingAddress?: Address,
  ) => Promise<Purchase>;
  cancelPurchase: (purchaseId: string, customerId: string) => Promise<void>;
  reset: () => void;
}

export function createPurchaseStore(services: ServiceContainer) {
  return create<PurchaseState>((set, get) => ({
    purchases: [],
    total: 0,
    page: 1,
    loading: false,
    error: null,

    fetchPurchases: async (customerId: string, page = 1) => {
      set({ loading: true, error: null });
      try {
        const res = await services.purchaseClient.listPurchases(customerId, page);
        set({
          purchases: res.purchases,
          total: res.total,
          page: res.page,
          loading: false,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch purchases';
        set({ error: message, loading: false });
      }
    },

    createPurchase: async (
      customerId: string,
      productId: string,
      quantity: number,
      promoCode?: string,
      shippingAddress?: Address,
    ) => {
      set({ loading: true, error: null });
      try {
        const idempotencyKey = crypto.randomUUID();
        const purchase = await services.purchaseClient.createPurchase({
          customerId,
          productId,
          quantity,
          promoCode,
          shippingAddress,
        }, idempotencyKey);
        // Prepend to existing list
        set((state) => ({
          purchases: [purchase, ...state.purchases],
          total: state.total + 1,
          loading: false,
        }));
        return purchase;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Purchase failed';
        set({ error: message, loading: false });
        throw err;
      }
    },

    cancelPurchase: async (purchaseId: string, customerId: string) => {
      const idempotencyKey = crypto.randomUUID();
      const updated = await services.purchaseClient.cancelPurchase(purchaseId, customerId, idempotencyKey);
      set((state) => ({
        purchases: state.purchases.map((p) => (p.id === purchaseId ? updated : p)),
      }));
    },

    reset: () => set({ purchases: [], total: 0, page: 1, loading: false, error: null }),
  }));
}
