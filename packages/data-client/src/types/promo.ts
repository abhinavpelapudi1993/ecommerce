export type DiscountType = 'percentage' | 'fixed';

export interface PromoCode {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxUses: number | null;
  currentUses: number;
  minPurchase: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreatePromoRequest {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxUses?: number;
  minPurchase?: number;
  expiresAt?: string;
  isActive?: boolean;
}

export interface ValidatePromoRequest {
  code: string;
  purchaseAmount: number;
}

export interface ValidatePromoResponse {
  valid: boolean;
  discountAmount: number;
  message?: string;
}
