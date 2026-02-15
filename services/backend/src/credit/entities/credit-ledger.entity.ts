import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum CreditEntryType {
  Grant = 'grant',
  Deduct = 'deduct',
  Purchase = 'purchase',
  Refund = 'refund',
}

@Entity('credit_ledger')
export class CreditLedgerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 20 })
  type: CreditEntryType;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Index()
  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
