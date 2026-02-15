import { BaseClient } from './base-client';
import type {
  CreditBalanceResponse,
  GrantCreditRequest,
  DeductCreditRequest,
} from '../types/credit';

function normalizeBalance(res: CreditBalanceResponse): CreditBalanceResponse {
  return {
    ...res,
    balance: Number(res.balance),
    ledger: res.ledger.map((e) => ({ ...e, amount: Number(e.amount) })),
  };
}

export class CreditClient extends BaseClient {
  async getBalance(customerId: string): Promise<CreditBalanceResponse> {
    return normalizeBalance(await this.get<CreditBalanceResponse>(`/credits/${customerId}/balance`));
  }

  async grantCredit(
    customerId: string,
    request: GrantCreditRequest,
  ): Promise<CreditBalanceResponse> {
    return normalizeBalance(
      await this.post<CreditBalanceResponse>(
        `/credits/${customerId}/grant`,
        request,
      ),
    );
  }

  async deductCredit(
    customerId: string,
    request: DeductCreditRequest,
  ): Promise<CreditBalanceResponse> {
    return normalizeBalance(
      await this.post<CreditBalanceResponse>(
        `/credits/${customerId}/deduct`,
        request,
      ),
    );
  }
}
