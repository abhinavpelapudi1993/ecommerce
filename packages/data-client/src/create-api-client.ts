import { CreditClient } from './clients/credit-client';
import { PurchaseClient } from './clients/purchase-client';
import { PromoClient } from './clients/promo-client';
import { ProductClient } from './clients/product-client';
import { CustomerClient } from './clients/customer-client';
import { ShipmentClient } from './clients/shipment-client';
import { RefundRequestClient } from './clients/refund-request-client';
import { CompanyClient } from './clients/company-client';

export interface ApiClient {
  credit: CreditClient;
  purchase: PurchaseClient;
  promo: PromoClient;
  product: ProductClient;
  customer: CustomerClient;
  shipment: ShipmentClient;
  refundRequest: RefundRequestClient;
  company: CompanyClient;
}

export function createApiClient(baseUrl: string): ApiClient {
  return {
    credit: new CreditClient(baseUrl),
    purchase: new PurchaseClient(baseUrl),
    promo: new PromoClient(baseUrl),
    product: new ProductClient(baseUrl),
    customer: new CustomerClient(baseUrl),
    shipment: new ShipmentClient(baseUrl),
    refundRequest: new RefundRequestClient(baseUrl),
    company: new CompanyClient(baseUrl),
  };
}
