import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum RefundRequestStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Failed = 'failed',
}

export enum RefundRequestType {
  Return = 'return',
  Refund = 'refund',
}

@Entity('refund_requests')
export class RefundRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'purchase_id', type: 'uuid' })
  purchaseId: string;

  @Index()
  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ type: 'varchar', length: 20, default: 'refund' })
  type: RefundRequestType;

  @Column({ type: 'text' })
  reason: string;

  @Column({ name: 'requested_amount', type: 'numeric', precision: 12, scale: 2, nullable: true })
  requestedAmount: number | null;

  @Column({ name: 'approved_amount', type: 'numeric', precision: 12, scale: 2, nullable: true })
  approvedAmount: number | null;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: RefundRequestStatus;

  @Column({ name: 'reviewer_note', type: 'text', nullable: true })
  reviewerNote: string | null;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
