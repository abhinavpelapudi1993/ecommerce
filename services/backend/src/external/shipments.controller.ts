import { Controller, Get, Param } from '@nestjs/common';
import { ShipmentApiService } from './shipment-api.service';
import type { Shipment } from './types';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentApi: ShipmentApiService) {}

  @Get(':shipmentId')
  async getShipment(@Param('shipmentId') shipmentId: string): Promise<Shipment> {
    return this.shipmentApi.getShipment(shipmentId);
  }
}
