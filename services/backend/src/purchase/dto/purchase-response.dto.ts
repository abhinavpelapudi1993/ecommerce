import type { PurchaseStatus } from '../entities/purchase.entity';

export interface PurchaseResponse {
  id: string;
  customerId: string;
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
  totalAmount: number;
  discountAmount: number;
  shipmentId: string | null;
  status: PurchaseStatus;
  errorMessage: string | null;
  refundedAmount: number;
  settledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseListResponse {
  purchases: PurchaseResponse[];
  total: number;
  page: number;
  limit: number;
}
