import { create } from 'zustand';
import type { ServiceContainer } from '../types';
import type { PromoCode, ValidatePromoResponse } from '@ecommerce/data-client';

interface PromoState {
  promos: PromoCode[];
  loading: boolean;
  error: string | null;
  validationResult: ValidatePromoResponse | null;
  fetchPromos: () => Promise<void>;
  createPromo: (data: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    maxUses?: number;
    minPurchase?: number;
    expiresAt?: string;
  }) => Promise<void>;
  validatePromo: (code: string, amount: number) => Promise<ValidatePromoResponse>;
  clearValidation: () => void;
  reset: () => void;
}

export function createPromoStore(services: ServiceContainer) {
  return create<PromoState>((set) => ({
    promos: [],
    loading: false,
    error: null,
    validationResult: null,

    fetchPromos: async () => {
      set({ loading: true, error: null });
      try {
        const promos = await services.promoClient.listPromos();
        set({ promos, loading: false });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch promos';
        set({ error: message, loading: false });
      }
    },

    createPromo: async (data) => {
      set({ loading: true, error: null });
      try {
        const promo = await services.promoClient.createPromo(data);
        set((state) => ({
          promos: [promo, ...state.promos],
          loading: false,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create promo';
        set({ error: message, loading: false });
        throw err;
      }
    },

    validatePromo: async (code: string, amount: number) => {
      set({ loading: true, error: null });
      try {
        const result = await services.promoClient.validatePromo({
          code,
          purchaseAmount: amount,
        });
        set({ validationResult: result, loading: false });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Validation failed';
        set({ error: message, loading: false });
        throw err;
      }
    },

    clearValidation: () => set({ validationResult: null }),
    reset: () => set({ promos: [], loading: false, error: null, validationResult: null }),
  }));
}
