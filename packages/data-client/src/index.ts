// Types
export type { Address, Customer } from './types/customer';
export type { Product, CreateProductRequest, UpdateProductRequest } from './types/product';
export { CreditEntryType } from './types/credit';
export type {
  CreditLedgerEntry,
  CreditBalanceResponse,
  GrantCreditRequest,
  DeductCreditRequest,
} from './types/credit';
export { PurchaseStatus, TransactionType, TransactionStatus } from './types/purchase';
export type {
  Purchase,
  PurchaseListResponse,
  CreatePurchaseRequest,
  Transaction,
} from './types/purchase';
export type {
  DiscountType,
  PromoCode,
  CreatePromoRequest,
  ValidatePromoRequest,
  ValidatePromoResponse,
} from './types/promo';
export { ShipmentStatus } from './types/shipment';
export type { Shipment } from './types/shipment';
export { RefundRequestStatus, RefundRequestType } from './types/refund-request';
export type {
  RefundRequest,
  CreateRefundRequestBody,
  ApproveRefundRequestBody,
  RejectRefundRequestBody,
} from './types/refund-request';
export { CompanyLedgerType } from './types/company';
export type {
  CompanyLedgerEntry,
  CompanyBalanceResponse,
} from './types/company';

// Clients
export { BaseClient, ApiError } from './clients/base-client';
export { CreditClient } from './clients/credit-client';
export { PurchaseClient } from './clients/purchase-client';
export { PromoClient } from './clients/promo-client';
export { ProductClient } from './clients/product-client';
export { CustomerClient } from './clients/customer-client';
export { ShipmentClient } from './clients/shipment-client';
export { RefundRequestClient } from './clients/refund-request-client';
export { CompanyClient } from './clients/company-client';

// Factory
export { createApiClient, type ApiClient } from './create-api-client';
