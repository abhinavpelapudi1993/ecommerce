import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShipmentEntity, ShippingAddress, ShipmentProduct, ShipmentStatus } from './shipment.entity';

function generateTrackingNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TRK-';
  for (let i = 0; i < 10; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(ShipmentEntity)
    private readonly repo: Repository<ShipmentEntity>,
  ) {}

  async create(shippingAddress: ShippingAddress, products: ShipmentProduct[]): Promise<ShipmentEntity> {
    const shipment = this.repo.create({
      status: ShipmentStatus.Processing,
      trackingNumber: generateTrackingNumber(),
      shippingAddress,
      products,
    });
    return this.repo.save(shipment);
  }

  async findOne(id: string): Promise<ShipmentEntity> {
    const shipment = await this.repo.findOne({ where: { id } });
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);
    return shipment;
  }

  async updateStatus(id: string, status: ShipmentStatus): Promise<ShipmentEntity> {
    const shipment = await this.findOne(id);
    const validStatuses: ShipmentStatus[] = [ShipmentStatus.Processing, ShipmentStatus.Shipped, ShipmentStatus.Delivered, ShipmentStatus.Returned, ShipmentStatus.Cancelled];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Cannot update a cancelled or returned shipment
    if (shipment.status === ShipmentStatus.Cancelled) {
      throw new BadRequestException('Cannot update a cancelled shipment');
    }
    if (shipment.status === ShipmentStatus.Returned) {
      throw new BadRequestException('Cannot update a returned shipment');
    }

    // Can only cancel from processing state
    if (status === ShipmentStatus.Cancelled && shipment.status !== ShipmentStatus.Processing) {
      throw new BadRequestException('Shipment can only be cancelled while processing');
    }

    // Can only return from delivered state
    if (status === ShipmentStatus.Returned && shipment.status !== ShipmentStatus.Delivered) {
      throw new BadRequestException('Shipment can only be returned after delivery');
    }

    shipment.status = status;
    return this.repo.save(shipment);
  }
}
