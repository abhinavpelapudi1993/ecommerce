import { BaseClient } from './base-client';
import type { Shipment, ShipmentStatus } from '../types/shipment';

export class ShipmentClient extends BaseClient {
  async getShipment(shipmentId: string): Promise<Shipment> {
    return this.get<Shipment>(`/shipments/${shipmentId}`);
  }

  async updateStatus(shipmentId: string, status: ShipmentStatus, idempotencyKey?: string): Promise<Shipment> {
    const options = idempotencyKey ? { headers: { 'X-Idempotency-Key': idempotencyKey } } : undefined;
    return this.patch<Shipment>(`/shipments/${shipmentId}`, { status }, options);
  }
}
