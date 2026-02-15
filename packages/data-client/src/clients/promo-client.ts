import { BaseClient } from './base-client';
import type {
  PromoCode,
  CreatePromoRequest,
  ValidatePromoRequest,
  ValidatePromoResponse,
} from '../types/promo';

export class PromoClient extends BaseClient {
  async createPromo(request: CreatePromoRequest): Promise<PromoCode> {
    return this.post<PromoCode>('/promos', request);
  }

  async listPromos(): Promise<PromoCode[]> {
    return this.get<PromoCode[]>('/promos');
  }

  async validatePromo(
    request: ValidatePromoRequest,
  ): Promise<ValidatePromoResponse> {
    return this.post<ValidatePromoResponse>('/promos/validate', request);
  }
}
