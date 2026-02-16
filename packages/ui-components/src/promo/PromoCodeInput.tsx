import { useState, type ChangeEvent } from 'react';
import { Button, Text } from '@clickhouse/click-ui';
import type { ValidatePromoResponse } from '@ecommerce/data-client';

interface PromoCodeInputProps {
  onValidate: (code: string) => Promise<ValidatePromoResponse>;
  onApply: (code: string, discountAmount: number) => void;
}

export function PromoCodeInput({ onValidate, onApply }: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ValidatePromoResponse | null>(null);
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    if (!code.trim()) return;
    setChecking(true);
    setResult(null);
    try {
      const res = await onValidate(code.trim());
      setResult(res);
      if (res.valid) {
        onApply(code.trim(), res.discountAmount);
      }
    } catch {
      setResult({ valid: false, discountAmount: 0, message: 'Validation failed' });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode((e.target as HTMLInputElement).value.toUpperCase())}
          placeholder="Enter promo code"
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid var(--click-color-border-default, #ccc)',
            color: '#fff',
            background: 'var(--click-color-bg-panel, rgba(255,255,255,0.05))',
          }}
        />
        <Button onClick={handleCheck} disabled={checking || !code.trim()}>
          {checking ? 'Checking...' : 'Apply'}
        </Button>
      </div>
      {result && (
        <Text
          color={result.valid ? 'default' : 'danger'}
          size="sm"
        >
          {result.valid
            ? `Discount applied: -$${result.discountAmount.toFixed(2)}`
            : result.message || 'Invalid promo code'}
        </Text>
      )}
    </div>
  );
}
