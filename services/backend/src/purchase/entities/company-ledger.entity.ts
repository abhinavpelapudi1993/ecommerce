import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum CompanyLedgerType {
  Sale = 'sale',
  Refund = 'refund',
  Escrow = 'escrow',
  EscrowRelease = 'escrow_release',
}

@Entity('company_ledger')
export class CompanyLedgerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 20 })
  type: CompanyLedgerType;

  @Index()
  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string | null;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
