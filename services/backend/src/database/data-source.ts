import { DataSource } from 'typeorm';
import { CreditLedgerEntity } from '../credit/entities/credit-ledger.entity';
import { PurchaseEntity } from '../purchase/entities/purchase.entity';
import { PromoCodeEntity } from '../promo/entities/promo-code.entity';
import { PromoUsageEntity } from '../promo/entities/promo-usage.entity';
import { InitialSchema1700000000000 } from './migrations/1700000000000-InitialSchema';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'ecommerce',
  password: process.env.DB_PASSWORD || 'ecommerce',
  database: process.env.DB_NAME || 'ecommerce',
  entities: [CreditLedgerEntity, PurchaseEntity, PromoCodeEntity, PromoUsageEntity],
  migrations: [InitialSchema1700000000000],
});
