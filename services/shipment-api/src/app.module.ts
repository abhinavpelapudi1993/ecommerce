import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggingModule } from '@ecommerce/logging';
import { ShipmentEntity } from './shipment.entity';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';

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
      entities: [ShipmentEntity],
      synchronize: false,
      migrations: ['dist/migrations/*.js'],
      migrationsRun: true,
    }),
    TypeOrmModule.forFeature([ShipmentEntity]),
  ],
  controllers: [ShipmentsController],
  providers: [ShipmentsService],
})
export class AppModule {}
