import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Button, Text } from '@clickhouse/click-ui';
import { CreditEntryType } from '@ecommerce/data-client';

interface CreditAdjustFormProps {
  type: CreditEntryType.Grant | CreditEntryType.Deduct;
  onSubmit: (amount: number, reason: string) => Promise<void>;
  loading?: boolean;
}

export function CreditAdjustForm({ type, onSubmit, loading }: CreditAdjustFormProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason');
      return;
    }

    try {
      await onSubmit(numAmount, reason.trim());
      setAmount('');
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const label = type === CreditEntryType.Grant ? 'Grant Credit' : 'Deduct Credit';

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label htmlFor={`${type}-amount`}>
          <Text size="sm">Amount ($)</Text>
        </label>
        <input
          id={`${type}-amount`}
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount((e.target as HTMLInputElement).value)}
          placeholder="0.00"
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid var(--click-color-border-default, #ccc)',
            marginTop: 4,
            color: 'inherit',
            background: 'var(--click-color-bg-panel, rgba(255,255,255,0.05))',
          }}
        />
      </div>
      <div>
        <label htmlFor={`${type}-reason`}>
          <Text size="sm">Reason</Text>
        </label>
        <input
          id={`${type}-reason`}
          type="text"
          value={reason}
          onChange={(e) => setReason((e.target as HTMLInputElement).value)}
          placeholder="Explain the adjustment..."
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid var(--click-color-border-default, #ccc)',
            marginTop: 4,
            color: 'inherit',
            background: 'var(--click-color-bg-panel, rgba(255,255,255,0.05))',
          }}
        />
      </div>
      {error && <Text color="danger">{error}</Text>}
      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Processing...' : label}
      </Button>
    </form>
  );
}
