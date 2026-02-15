import { createApiClient } from '@ecommerce/data-client';
import type { ServiceContainer } from '@ecommerce/state-service';

const API_BASE = '/api';

const api = createApiClient(API_BASE);

export const container: ServiceContainer = {
  creditClient: api.credit,
  purchaseClient: api.purchase,
  promoClient: api.promo,
  productClient: api.product,
  customerClient: api.customer,
  shipmentClient: api.shipment,
  refundRequestClient: api.refundRequest,
  companyClient: api.company,
};
