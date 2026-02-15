import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { AppConfig } from '../config/app.config';
import type { ShipmentRequest, ShipmentResponse, Shipment } from './types';

@Injectable()
export class ShipmentApiService {
  constructor(
    private readonly http: HttpService,
    @Inject('APP_CONFIG') private readonly config: AppConfig,
  ) {}

  async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
    const url = `${this.config.shipmentApiUrl}/shipments`;
    const { data } = await firstValueFrom(
      this.http.post<ShipmentResponse>(url, request),
    );
    return data;
  }

  async getShipment(shipmentId: string): Promise<Shipment> {
    const url = `${this.config.shipmentApiUrl}/shipments/${shipmentId}`;
    const { data } = await firstValueFrom(
      this.http.get<Shipment>(url),
    );
    return data;
  }

  async updateShipmentStatus(shipmentId: string, status: string): Promise<Shipment> {
    const url = `${this.config.shipmentApiUrl}/shipments/${shipmentId}`;
    const { data } = await firstValueFrom(
      this.http.patch<Shipment>(url, { status }),
    );
    return data;
  }
}
