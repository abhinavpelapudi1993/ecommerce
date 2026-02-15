import type { CreditEntryType } from '../entities/credit-ledger.entity';

export interface CreditLedgerEntryResponse {
  id: string;
  amount: number;
  type: CreditEntryType;
  reason: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface CreditBalanceResponse {
  customerId: string;
  balance: number;
  ledger: CreditLedgerEntryResponse[];
}
