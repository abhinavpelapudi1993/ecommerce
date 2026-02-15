import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggingModule } from '@ecommerce/logging';
import { CustomerEntity } from './customer.entity';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [
    LoggingModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'ecommerce',
      password: process.env.DB_PASSWORD || 'ecommerce',
      database: process.env.DB_NAME || 'ecommerce',
      entities: [CustomerEntity],
      synchronize: false,
      migrations: ['dist/migrations/*.js'],
      migrationsRun: true,
    }),
    TypeOrmModule.forFeature([CustomerEntity]),
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class AppModule {}
