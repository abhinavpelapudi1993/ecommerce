import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Button, Title, Text } from '@clickhouse/click-ui';
import { PageContainer } from '@ecommerce/ui-components';
import { useServices, createPromoStore } from '@ecommerce/state-service';
import { useStore } from 'zustand';

export function PromoManagePage() {
  const services = useServices();
  const store = useMemo(() => createPromoStore(services), [services]);
  const { promos, loading, error, fetchPromos, createPromo } = useStore(store);

  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!code.trim() || !discountValue) {
      setFormError('Code and discount value are required');
      return;
    }

    try {
      await createPromo({
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: parseFloat(discountValue),
        maxUses: maxUses ? parseInt(maxUses) : undefined,
        minPurchase: minPurchase ? parseFloat(minPurchase) : undefined,
      });
      setCode('');
      setDiscountValue('');
      setMaxUses('');
      setMinPurchase('');
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create promo');
    }
  };

  return (
    <PageContainer
      title="Promo Codes"
      actions={
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Promo'}
        </Button>
      }
    >
      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            marginBottom: 24,
            padding: 16,
            border: '1px solid var(--click-color-border-default, #e0e0e0)',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            maxWidth: 400,
          }}
        >
          <Title type="h4">Create Promo Code</Title>
          <input
            type="text"
            placeholder="Code (e.g., SAVE20)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={inputStyle}
          />
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
            style={inputStyle}
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed ($)</option>
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="Discount value"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            style={inputStyle}
          />
          <input
            type="number"
            placeholder="Max uses (optional)"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            style={inputStyle}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Min purchase amount (optional)"
            value={minPurchase}
            onChange={(e) => setMinPurchase(e.target.value)}
            style={inputStyle}
          />
          {formError && <Text color="danger">{formError}</Text>}
          <Button onClick={handleCreate} disabled={loading}>
            Create
          </Button>
        </form>
      )}

      {error && <Text color="danger">{error}</Text>}

      {promos.length === 0 && !loading ? (
        <Text color="muted">No promo codes yet. Create one above.</Text>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Code</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Value</th>
              <th style={thStyle}>Uses</th>
              <th style={thStyle}>Min Purchase</th>
              <th style={thStyle}>Active</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((p) => (
              <tr key={p.id}>
                <td style={tdStyle}>
                  <code>{p.code}</code>
                </td>
                <td style={tdStyle}>{p.discountType}</td>
                <td style={tdStyle}>
                  {p.discountType === 'percentage'
                    ? `${p.discountValue}%`
                    : `$${Number(p.discountValue).toFixed(2)}`}
                </td>
                <td style={tdStyle}>
                  {p.currentUses} / {p.maxUses ?? '∞'}
                </td>
                <td style={tdStyle}>
                  ${Number(p.minPurchase).toFixed(2)}
                </td>
                <td style={tdStyle}>
                  <span style={{ color: p.isActive ? '#22c55e' : '#ef4444' }}>
                    {p.isActive ? 'Yes' : 'No'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PageContainer>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid var(--click-color-border-default, #ccc)',
  width: '100%',
  color: 'inherit',
  background: 'var(--click-color-bg-panel, rgba(255,255,255,0.05))',
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
};
