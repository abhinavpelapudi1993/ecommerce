import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum TransactionType {
  OrderPlaced = 'order_placed',
  ShipmentDelivered = 'shipment_delivered',
  Refund = 'refund',
  SettlementFailed = 'settlement_failed',
  RefundFailed = 'refund_failed',
  OrderCancelled = 'order_cancelled',
}

export enum TransactionStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
}

@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'purchase_id', type: 'uuid' })
  purchaseId: string;

  @Index()
  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ type: 'varchar', length: 30 })
  type: TransactionType;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: TransactionStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
