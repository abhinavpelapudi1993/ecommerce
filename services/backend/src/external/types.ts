export interface Address {
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
}

export interface Customer {
  id: string;
  name: string;
  billingAddress: Address;
  shippingAddress: Address;
  email: string;
  createdAt: number;
  lastModifiedAt: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  createdAt: number;
  lastModifiedAt: number;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
}

export interface ShipmentRequest {
  shippingAddress: Address;
  products: Array<{ sku: string; quantity: number }>;
}

export interface ShipmentResponse {
  id: string;
}

export type ShipmentStatus = 'processing' | 'shipped' | 'delivered';

export interface Shipment {
  id: string;
  status: ShipmentStatus;
  trackingNumber: string;
  shippingAddress: Address;
  products: Array<{ sku: string; quantity: number }>;
  createdAt: string;
}
