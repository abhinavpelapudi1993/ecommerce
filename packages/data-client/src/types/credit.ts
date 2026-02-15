export enum CreditEntryType {
  Grant = 'grant',
  Deduct = 'deduct',
  Purchase = 'purchase',
  Refund = 'refund',
}

export interface CreditLedgerEntry {
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
  ledger: CreditLedgerEntry[];
}

export interface GrantCreditRequest {
  amount: number;
  reason: string;
}

export interface DeductCreditRequest {
  amount: number;
  reason: string;
}
