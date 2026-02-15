import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PromoCodeEntity } from './promo-code.entity';

@Entity('promo_usages')
export class PromoUsageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'promo_code_id', type: 'uuid' })
  promoCodeId: string;

  @ManyToOne(() => PromoCodeEntity)
  @JoinColumn({ name: 'promo_code_id' })
  promoCode: PromoCodeEntity;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'purchase_id', type: 'uuid' })
  purchaseId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
