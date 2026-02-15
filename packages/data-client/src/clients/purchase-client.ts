import { BaseClient } from './base-client';
import type {
  Purchase,
  PurchaseListResponse,
  CreatePurchaseRequest,
  Transaction,
} from '../types/purchase';

function normalizePurchase(p: Purchase): Purchase {
  return {
    ...p,
    priceAtPurchase: Number(p.priceAtPurchase),
    totalAmount: Number(p.totalAmount),
    discountAmount: Number(p.discountAmount),
    refundedAmount: Number(p.refundedAmount),
  };
}

export class PurchaseClient extends BaseClient {
  async createPurchase(request: CreatePurchaseRequest, idempotencyKey?: string): Promise<Purchase> {
    const options = idempotencyKey ? { headers: { 'X-Idempotency-Key': idempotencyKey } } : undefined;
    return normalizePurchase(await this.post<Purchase>('/purchases', request, options));
  }

  async listPurchases(
    customerId?: string,
    page = 1,
    limit = 20,
  ): Promise<PurchaseListResponse> {
    const params = new URLSearchParams();
    if (customerId) params.set('customerId', customerId);
    params.set('page', String(page));
    params.set('limit', String(limit));
    const res = await this.get<PurchaseListResponse>(`/purchases?${params.toString()}`);
    return { ...res, purchases: res.purchases.map(normalizePurchase) };
  }

  async getPurchase(purchaseId: string): Promise<Purchase> {
    return normalizePurchase(await this.get<Purchase>(`/purchases/${purchaseId}`));
  }

  async cancelPurchase(purchaseId: string, customerId: string, idempotencyKey?: string): Promise<Purchase> {
    const options = idempotencyKey ? { headers: { 'X-Idempotency-Key': idempotencyKey } } : undefined;
    return normalizePurchase(await this.post<Purchase>(`/purchases/${purchaseId}/cancel`, { customerId }, options));
  }

  async getTransactions(purchaseId: string): Promise<Transaction[]> {
    const list = await this.get<Transaction[]>(`/purchases/${purchaseId}/transactions`);
    return list.map((t) => ({ ...t, amount: Number(t.amount) }));
  }
}
