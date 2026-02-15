import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PurchaseStatus {
  Pending = 'pending',
  Settled = 'settled',
  PartiallyRefunded = 'partially_refunded',
  Refunded = 'refunded',
  SettlementFailed = 'settlement_failed',
  RefundFailed = 'refund_failed',
  Cancelled = 'cancelled',
}

@Entity('purchases')
export class PurchaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'product_sku' })
  productSku: string;

  @Column({ name: 'product_name', length: 500 })
  productName: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ name: 'price_at_purchase', type: 'numeric', precision: 12, scale: 2 })
  priceAtPurchase: number;

  @Column({ name: 'total_amount', type: 'numeric', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ name: 'discount_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'promo_code_id', type: 'uuid', nullable: true })
  promoCodeId: string | null;

  @Column({ name: 'shipment_id', type: 'varchar', nullable: true })
  shipmentId: string | null;

  @Column({ type: 'varchar', length: 30, default: 'pending' })
  status: PurchaseStatus;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string | null;

  @Column({ name: 'refunded_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  refundedAmount: number;

  @Column({ name: 'settled_at', type: 'timestamptz', nullable: true })
  settledAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
