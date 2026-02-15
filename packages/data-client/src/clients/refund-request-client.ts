import { BaseClient } from './base-client';
import type {
  RefundRequest,
  CreateRefundRequestBody,
  ApproveRefundRequestBody,
  RejectRefundRequestBody,
} from '../types/refund-request';

function normalize(r: RefundRequest): RefundRequest {
  return {
    ...r,
    requestedAmount: r.requestedAmount != null ? Number(r.requestedAmount) : null,
    approvedAmount: r.approvedAmount != null ? Number(r.approvedAmount) : null,
  };
}

export class RefundRequestClient extends BaseClient {
  async createRequest(purchaseId: string, body: CreateRefundRequestBody): Promise<RefundRequest> {
    return normalize(await this.post<RefundRequest>(`/purchases/${purchaseId}/refund-request`, body));
  }

  async listRequests(status?: string): Promise<RefundRequest[]> {
    const params = status ? `?status=${encodeURIComponent(status)}` : '';
    const list = await this.get<RefundRequest[]>(`/refund-requests${params}`);
    return list.map(normalize);
  }

  async approveRequest(requestId: string, body: ApproveRefundRequestBody, idempotencyKey?: string): Promise<RefundRequest> {
    const options = idempotencyKey ? { headers: { 'X-Idempotency-Key': idempotencyKey } } : undefined;
    return normalize(await this.post<RefundRequest>(`/refund-requests/${requestId}/approve`, body, options));
  }

  async rejectRequest(requestId: string, body: RejectRefundRequestBody): Promise<RefundRequest> {
    return normalize(await this.post<RefundRequest>(`/refund-requests/${requestId}/reject`, body));
  }
}
