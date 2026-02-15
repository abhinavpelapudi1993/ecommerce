export enum PurchaseStatus {
  Pending = 'pending',
  Settled = 'settled',
  PartiallyRefunded = 'partially_refunded',
  Refunded = 'refunded',
  SettlementFailed = 'settlement_failed',
  RefundFailed = 'refund_failed',
  Cancelled = 'cancelled',
}

export interface Purchase {
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
  purchases: Purchase[];
  total: number;
  page: number;
  limit: number;
}

export enum TransactionType {
  OrderPlaced = 'order_placed',
  ShipmentDelivered = 'shipment_delivered',
  Refund = 'refund',
  SettlementFailed = 'settlement_failed',
  RefundFailed = 'refund_failed',
  OrderCancelled = 'order_cancelled',
}

export enum TransactionStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
}

export interface Transaction {
  id: string;
  purchaseId: string;
  customerId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface CreatePurchaseRequest {
  customerId: string;
  productId: string;
  quantity: number;
  promoCode?: string;
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    state: string;
    country: string;
  };
}
