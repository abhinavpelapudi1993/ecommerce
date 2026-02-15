import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
}

@Entity('customers')
export class CustomerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'jsonb', name: 'billing_address' })
  billingAddress: Address;

  @Column({ type: 'jsonb', name: 'shipping_address' })
  shippingAddress: Address;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'last_modified_at', type: 'timestamp', default: () => 'NOW()' })
  lastModifiedAt: Date;
}
