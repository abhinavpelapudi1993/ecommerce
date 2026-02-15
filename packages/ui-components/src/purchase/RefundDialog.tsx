import { useState, type FormEvent } from 'react';
import { Button, Title, Text } from '@clickhouse/click-ui';
import type { Purchase } from '@ecommerce/data-client';

interface RefundDialogProps {
  purchase: Purchase;
  open: boolean;
  onClose: () => void;
  mode: 'request' | 'approve';
  refundType?: 'return' | 'refund';
  onSubmit: (purchaseId: string, data: { amount?: number; reason: string; note?: string }) => Promise<void>;
}

export function RefundDialog({ purchase, open, onClose, mode, refundType = 'refund', onSubmit }: RefundDialogProps) {
  const maxRefundable = purchase.totalAmount - purchase.refundedAmount;
  const isReturn = refundType === 'return';
  const maxAmount = isReturn ? maxRefundable : Math.min(maxRefundable, purchase.totalAmount * 0.5);

  const [amount, setAmount] = useState(
    mode === 'approve' ? maxRefundable.toFixed(2) :
    isReturn ? maxRefundable.toFixed(2) : '',
  );
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'request') {
      if (!reason.trim()) {
        setError(`Please provide a reason for the ${isReturn ? 'return' : 'refund'} request`);
        return;
      }

      if (isReturn) {
        // Return: full refund, no amount input needed
        setSubmitting(true);
        try {
          await onSubmit(purchase.id, { amount: maxRefundable, reason: reason.trim() });
          onClose();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Request failed');
        } finally {
          setSubmitting(false);
        }
      } else {
        // Refund: require amount, max 50%
        const numAmount = amount ? parseFloat(amount) : undefined;
        if (numAmount === undefined || isNaN(numAmount) || numAmount <= 0) {
          setError('Enter a valid refund amount');
          return;
        }
        if (numAmount > maxAmount) {
          setError(`Maximum refundable: $${maxAmount.toFixed(2)} (50% of order total)`);
          return;
        }

        setSubmitting(true);
        try {
          await onSubmit(purchase.id, { amount: numAmount, reason: reason.trim() });
          onClose();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Request failed');
        } finally {
          setSubmitting(false);
        }
      }
    } else {
      // approve mode
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        setError('Enter a valid refund amount');
        return;
      }
      if (numAmount > maxRefundable) {
        setError(`Maximum refundable: $${maxRefundable.toFixed(2)}`);
        return;
      }

      setSubmitting(true);
      try {
        await onSubmit(purchase.id, { amount: numAmount, reason: '', note: note.trim() || undefined });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Approval failed');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const title = mode === 'approve'
    ? 'Approve Refund'
    : isReturn
      ? 'Request Return'
      : 'Request Refund';

  const submitLabel = mode === 'approve'
    ? 'Approve Refund'
    : isReturn
      ? 'Submit Return'
      : 'Submit Refund';

  const submittingLabel = mode === 'approve'
    ? 'Approving...'
    : 'Submitting...';

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--click-color-bg-default, #fff)',
          borderRadius: 12,
          padding: 24,
          width: 420,
          maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Title type="h3">{title}</Title>
        <div style={{ margin: '12px 0' }}>
          <Text>
            {purchase.productName} — ${purchase.totalAmount.toFixed(2)}
          </Text>
          <br />
          <Text color="muted" size="sm">
            Already refunded: ${purchase.refundedAmount.toFixed(2)}
            {isReturn
              ? ` | Return amount: $${maxRefundable.toFixed(2)} (full)`
              : ` | Max refundable: $${maxAmount.toFixed(2)} (50%)`}
          </Text>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'request' && (
            <>
              <div>
                <label htmlFor="refund-reason">
                  <Text size="sm">Reason *</Text>
                </label>
                <input
                  id="refund-reason"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason((e.target as HTMLInputElement).value)}
                  placeholder={isReturn ? 'Why are you returning this item?' : 'Why are you requesting a refund?'}
                  style={inputStyle}
                />
              </div>
              {!isReturn && (
                <div>
                  <label htmlFor="refund-amount">
                    <Text size="sm">Refund Amount *</Text>
                  </label>
                  <input
                    id="refund-amount"
                    type="text"
                    inputMode="decimal"
                    max={maxAmount}
                    value={amount}
                    onChange={(e) => setAmount((e.target as HTMLInputElement).value)}
                    placeholder={`Up to $${maxAmount.toFixed(2)}`}
                    style={inputStyle}
                  />
                </div>
              )}
            </>
          )}

          {mode === 'approve' && (
            <>
              <div>
                <label htmlFor="refund-amount">
                  <Text size="sm">Refund Amount ($) *</Text>
                </label>
                <input
                  id="refund-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={maxRefundable}
                  value={amount}
                  onChange={(e) => setAmount((e.target as HTMLInputElement).value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="refund-note">
                  <Text size="sm">Note (optional)</Text>
                </label>
                <input
                  id="refund-note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote((e.target as HTMLInputElement).value)}
                  placeholder="Reviewer note..."
                  style={inputStyle}
                />
              </div>
            </>
          )}

          {error && <Text color="danger">{error}</Text>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button type="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? submittingLabel : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid var(--click-color-border-default, #ccc)',
  marginTop: 4,
  color: 'inherit',
  background: 'var(--click-color-bg-panel, rgba(255,255,255,0.05))',
};
