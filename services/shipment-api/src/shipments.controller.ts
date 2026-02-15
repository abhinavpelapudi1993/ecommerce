import { Controller, Post, Get, Patch, Param, Body, BadRequestException } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { ShipmentEntity, ShipmentStatus } from './shipment.entity';

interface CreateShipmentBody {
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    state: string;
    country: string;
  };
  products: { sku: string; quantity: number }[];
}

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly service: ShipmentsService) {}

  @Post()
  async createShipment(@Body() body: CreateShipmentBody): Promise<{ id: string }> {
    if (!body.shippingAddress || !body.products?.length) {
      throw new BadRequestException('Missing shippingAddress or products');
    }
    const shipment = await this.service.create(body.shippingAddress, body.products);
    return { id: shipment.id };
  }

  @Get(':id')
  getShipment(@Param('id') id: string): Promise<ShipmentEntity> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  updateShipment(
    @Param('id') id: string,
    @Body() body: { status: ShipmentStatus },
  ): Promise<ShipmentEntity> {
    return this.service.updateStatus(id, body.status);
  }
}
