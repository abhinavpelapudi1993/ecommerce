import { BaseClient } from './base-client';
import type { CompanyBalanceResponse } from '../types/company';

export class CompanyClient extends BaseClient {
  async getBalance(): Promise<CompanyBalanceResponse> {
    const res = await this.get<CompanyBalanceResponse>('/company/balance');
    return {
      ...res,
      balance: Number(res.balance),
      ledger: res.ledger.map((e) => ({ ...e, amount: Number(e.amount) })),
    };
  }
}
