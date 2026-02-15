export interface AppConfig {
  customerApiUrl: string;
  productApiUrl: string;
  shipmentApiUrl: string;
  port: number;
}

export function getAppConfig(): AppConfig {
  return {
    customerApiUrl: process.env.CUSTOMER_API_URL || 'http://localhost:3001',
    productApiUrl: process.env.PRODUCT_API_URL || 'http://localhost:3002',
    shipmentApiUrl: process.env.SHIPMENT_API_URL || 'http://localhost:3003',
    port: parseInt(process.env.PORT || '3000', 10),
  };
}
