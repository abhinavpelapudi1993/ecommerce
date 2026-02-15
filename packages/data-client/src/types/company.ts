export enum CompanyLedgerType {
  Sale = 'sale',
  Refund = 'refund',
  Escrow = 'escrow',
  EscrowRelease = 'escrow_release',
}

export interface CompanyLedgerEntry {
  id: string;
  amount: number;
  type: CompanyLedgerType;
  referenceId: string | null;
  reason: string;
  createdAt: string;
}

export interface CompanyBalanceResponse {
  balance: number;
  ledger: CompanyLedgerEntry[];
}
