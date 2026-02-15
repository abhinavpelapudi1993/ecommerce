import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CustomerApiService } from './customer-api.service';
import { ProductApiService } from './product-api.service';
import { ShipmentApiService } from './shipment-api.service';
import { ProductsController } from './products.controller';
import { CustomersController } from './customers.controller';
import { ShipmentsController } from './shipments.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
  ],
  controllers: [ProductsController, CustomersController, ShipmentsController],
  providers: [CustomerApiService, ProductApiService, ShipmentApiService],
  exports: [CustomerApiService, ProductApiService, ShipmentApiService],
})
export class ExternalModule {}
