import { useEffect, useState, type FormEvent } from 'react';
import { Button, Title, Text } from '@clickhouse/click-ui';
import { PageContainer } from '@ecommerce/ui-components';
import { useServices } from '@ecommerce/state-service';
import { Link } from 'react-router-dom';
import { RefundRequestStatus } from '@ecommerce/data-client';
import type { RefundRequest, ApproveRefundRequestBody } from '@ecommerce/data-client';

type StatusFilter = 'all' | RefundRequestStatus;

export function RefundRequestsPage() {
  const services = useServices();
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const [approveTarget, setApproveTarget] = useState<RefundRequest | null>(null);
  const [approveAmount, setApproveAmount] = useState('');
  const [approveNote, setApproveNote] = useState('');
  const [approveError, setApproveError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  const [rejectTarget, setRejectTarget] = useState<RefundRequest | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const fetchRequests = async (status: StatusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = status === 'all' ? undefined : status;
      const list = await services.refundRequestClient.listRequests(statusParam);
      setRequests(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load refund requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(filter);
  }, [filter]);

  const handleApprove = async (e: FormEvent) => {
    e.preventDefault();
    if (!approveTarget) return;
    setApproveError(null);

    const amount = parseFloat(approveAmount);
    if (isNaN(amount) || amount <= 0) {
      setApproveError('Enter a valid amount');
      return;
    }

    setApproving(true);
    try {
      const body: ApproveRefundRequestBody = {
        amount,
        note: approveNote.trim() || undefined,
      };
      const idempotencyKey = crypto.randomUUID();
      await services.refundRequestClient.approveRequest(approveTarget.id, body, idempotencyKey);
      setApproveTarget(null);
      setApproveAmount('');
      setApproveNote('');
      await fetchRequests(filter);
    } catch (err) {
      setApproveError(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (e: FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;

    setRejecting(true);
    try {
      await services.refundRequestClient.rejectRequest(rejectTarget.id, {
        note: rejectNote.trim() || undefined,
      });
      setRejectTarget(null);
      setRejectNote('');
      await fetchRequests(filter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request');
      setRejectTarget(null);
    } finally {
      setRejecting(false);
    }
  };

  const openApprove = (req: RefundRequest) => {
    setApproveTarget(req);
    setApproveAmount(req.requestedAmount != null ? req.requestedAmount.toString() : '');
    setApproveNote('');
    setApproveError(null);
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      [RefundRequestStatus.Pending]: '#3b82f6',
      [RefundRequestStatus.Approved]: '#22c55e',
      [RefundRequestStatus.Rejected]: '#ef4444',
      [RefundRequestStatus.Failed]: '#dc2626',
    };
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 10px',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 600,
          color: '#fff',
          background: colors[status] || '#888',
        }}
      >
        {status}
      </span>
    );
  };

  const filters: StatusFilter[] = ['all', RefundRequestStatus.Pending, RefundRequestStatus.Approved, RefundRequestStatus.Rejected, RefundRequestStatus.Failed];

  return (
    <PageContainer title="Refund Requests">
      {/* Filter tabs */}
      <div style={tabBar}>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={filter === f ? activeTab : inactiveTab}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <Text color="danger" style={{ display: 'block', marginBottom: 12 }}>
          {error}
        </Text>
      )}

      {loading && requests.length === 0 ? (
        <Text color="muted">Loading refund requests...</Text>
      ) : requests.length === 0 ? (
        <Text color="muted">No refund requests found.</Text>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Customer ID</th>
              <th style={thStyle}>Purchase ID</th>
              <th style={thStyle}>Reason</th>
              <th style={thStyle}>Requested</th>
              <th style={thStyle}>Approved</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td style={tdStyle}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
                <td style={tdStyle}>
                  <Link
                    to={`/customer/${r.customerId}`}
                    style={{ color: '#3b82f6', textDecoration: 'none' }}
                  >
                    {r.customerId}
                  </Link>
                </td>
                <td style={tdStyle}>
                  <Text size="sm" style={{ wordBreak: 'break-all' }}>{r.purchaseId}</Text>
                </td>
                <td style={tdStyle}>
                  <Text size="sm">{r.reason}</Text>
                </td>
                <td style={tdStyle}>
                  {r.requestedAmount != null ? `$${r.requestedAmount.toFixed(2)}` : '--'}
                </td>
                <td style={tdStyle}>
                  {r.approvedAmount != null ? `$${r.approvedAmount.toFixed(2)}` : '--'}
                </td>
                <td style={tdStyle}>{statusBadge(r.status)}</td>
                <td style={tdStyle}>
                  {r.status === RefundRequestStatus.Pending && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button type="secondary" onClick={() => openApprove(r)}>
                        Approve
                      </Button>
                      <Button type="secondary" onClick={() => { setRejectTarget(r); setRejectNote(''); }}>
                        Reject
                      </Button>
                    </div>
                  )}
                  {r.reviewerNote && (
                    <Text color="muted" size="sm" style={{ display: 'block', marginTop: 4 }}>
                      Note: {r.reviewerNote}
                    </Text>
                  )}
                  {r.errorMessage && (
                    <Text color="danger" size="sm" style={{ display: 'block', marginTop: 4 }}>
                      Error: {r.errorMessage}
                    </Text>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Approve Dialog */}
      {approveTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setApproveTarget(null)}
        >
          <div
            style={{
              background: 'var(--click-color-bg-default, #fff)',
              color: '#1a1a2e',
              borderRadius: 12,
              padding: 24,
              width: 420,
              maxWidth: '90vw',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Title type="h3">Approve Refund</Title>
            <div style={{ margin: '12px 0' }}>
              <Text color="muted" size="sm">
                Purchase: {approveTarget.purchaseId}
              </Text>
              <br />
              <Text color="muted" size="sm">
                Requested: {approveTarget.requestedAmount != null
                  ? `$${approveTarget.requestedAmount.toFixed(2)}`
                  : 'Not specified'}
              </Text>
            </div>
            <form onSubmit={handleApprove} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label htmlFor="approve-amount">
                  <Text size="sm">Approved Amount ($)</Text>
                </label>
                <input
                  id="approve-amount"
                  type="text"
                  inputMode="decimal"
                  value={approveAmount}
                  onChange={(e) => setApproveAmount(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="approve-note">
                  <Text size="sm">Note (optional)</Text>
                </label>
                <input
                  id="approve-note"
                  type="text"
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  placeholder="Optional reviewer note"
                  style={inputStyle}
                />
              </div>
              {approveError && <Text color="danger">{approveError}</Text>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button type="secondary" onClick={() => setApproveTarget(null)}>
                  Cancel
                </Button>
                <Button onClick={handleApprove} disabled={approving}>
                  {approving ? 'Approving...' : 'Approve'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {rejectTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setRejectTarget(null)}
        >
          <div
            style={{
              background: 'var(--click-color-bg-default, #fff)',
              color: '#1a1a2e',
              borderRadius: 12,
              padding: 24,
              width: 420,
              maxWidth: '90vw',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Title type="h3">Reject Refund</Title>
            <div style={{ margin: '12px 0' }}>
              <Text color="muted" size="sm">
                Purchase: {rejectTarget.purchaseId}
              </Text>
            </div>
            <form onSubmit={handleReject} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label htmlFor="reject-note">
                  <Text size="sm">Note (optional)</Text>
                </label>
                <input
                  id="reject-note"
                  type="text"
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Optional rejection reason"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button type="secondary" onClick={() => setRejectTarget(null)}>
                  Cancel
                </Button>
                <Button onClick={handleReject} disabled={rejecting}>
                  {rejecting ? 'Rejecting...' : 'Reject'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid var(--click-color-border-default, #ccc)',
  width: '100%',
  marginTop: 4,
  color: '#1a1a2e',
  background: 'var(--click-color-bg-panel, rgba(255,255,255,0.05))',
};

const tabBar: React.CSSProperties = {
  display: 'flex',
  gap: 0,
  borderBottom: '2px solid var(--click-color-border-default, #e0e0e0)',
  marginBottom: 24,
};

const baseTab: React.CSSProperties = {
  padding: '10px 20px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  color: 'inherit',
  borderBottom: '2px solid transparent',
  marginBottom: -2,
  transition: 'all 0.15s',
};

const activeTab: React.CSSProperties = {
  ...baseTab,
  borderBottomColor: '#FADB14',
  color: 'inherit',
};

const inactiveTab: React.CSSProperties = {
  ...baseTab,
  opacity: 0.6,
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  borderBottom: '2px solid var(--click-color-border-default, #e0e0e0)',
  fontSize: 13,
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid var(--click-color-border-default, #f0f0f0)',
  fontSize: 14,
  verticalAlign: 'top',
};
