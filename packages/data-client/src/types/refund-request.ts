export enum RefundRequestStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Failed = 'failed',
}

export enum RefundRequestType {
  Return = 'return',
  Refund = 'refund',
}

export interface RefundRequest {
  id: string;
  purchaseId: string;
  customerId: string;
  type: RefundRequestType;
  reason: string;
  requestedAmount: number | null;
  approvedAmount: number | null;
  status: RefundRequestStatus;
  reviewerNote: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRefundRequestBody {
  customerId: string;
  type: RefundRequestType;
  reason: string;
  requestedAmount?: number;
}

export interface ApproveRefundRequestBody {
  amount: number;
  note?: string;
}

export interface RejectRefundRequestBody {
  note?: string;
}
