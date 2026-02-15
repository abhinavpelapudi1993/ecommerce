import type { Address } from './customer';

export enum ShipmentStatus {
  Processing = 'processing',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Returned = 'returned',
  Cancelled = 'cancelled',
}

export interface Shipment {
  id: string;
  status: ShipmentStatus;
  trackingNumber: string;
  shippingAddress: Address;
  products: Array<{ sku: string; quantity: number }>;
  createdAt: string;
}
