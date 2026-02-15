import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
}

export interface ShipmentProduct {
  sku: string;
  quantity: number;
}

export enum ShipmentStatus {
  Processing = 'processing',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Returned = 'returned',
  Cancelled = 'cancelled',
}

@Entity('shipments')
export class ShipmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'processing' })
  status: ShipmentStatus;

  @Column({ name: 'tracking_number' })
  trackingNumber: string;

  @Column({ type: 'jsonb', name: 'shipping_address' })
  shippingAddress: ShippingAddress;

  @Column({ type: 'jsonb' })
  products: ShipmentProduct[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
