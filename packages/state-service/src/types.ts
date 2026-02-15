import type { CreditClient, PurchaseClient, PromoClient, ProductClient, CustomerClient, ShipmentClient, RefundRequestClient, CompanyClient } from '@ecommerce/data-client';

/**
 * DI container interface — the contract that all apps must satisfy.
 * Apps wire this with real or mock clients depending on the environment.
 */
export interface ServiceContainer {
  creditClient: CreditClient;
  purchaseClient: PurchaseClient;
  promoClient: PromoClient;
  productClient: ProductClient;
  customerClient: CustomerClient;
  shipmentClient: ShipmentClient;
  refundRequestClient: RefundRequestClient;
  companyClient: CompanyClient;
}
