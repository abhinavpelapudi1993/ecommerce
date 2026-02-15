import { useState } from 'react';
import { Title, Text } from '@clickhouse/click-ui';
import { CreditEntryType } from '@ecommerce/data-client';
import type { CreditLedgerEntry } from '@ecommerce/data-client';

interface BillingDashboardProps {
  customerName: string;
  balance: number | null;
  ledger: CreditLedgerEntry[];
  loading?: boolean;
}

export function BillingDashboard({
  customerName,
  balance,
  ledger,
  loading,
}: BillingDashboardProps) {
  const [creditsOpen, setCreditsOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);

  if (loading) {
    return <Text color="muted">Loading account data...</Text>;
  }

  // Compute summary from ledger
  const granted = ledger
    .filter((e) => e.type === CreditEntryType.Grant || e.type === CreditEntryType.Refund)
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);

  const used = ledger
    .filter((e) => e.type === CreditEntryType.Purchase || e.type === CreditEntryType.Deduct)
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);

  return (
    <div>
      <Title type="h2" style={{ marginBottom: 4 }}>Billing</Title>
      <Text color="muted" style={{ display: 'block', marginBottom: 24 }}>
        {customerName}
      </Text>

      {/* Summary cards row */}
      <div style={cardRow}>
        <SummaryCard label="Credits Granted" value={`$${granted.toFixed(2)}`} />
        <SummaryCard
          label="Credits Used"
          value={`$${used.toFixed(2)}`}
        />
        <SummaryCard
          label="Remaining Balance"
          value={`$${(balance ?? 0).toFixed(2)}`}
          highlight
        />
        <SummaryCard
          label="Transactions"
          value={String(ledger.length)}
        />
      </div>

      {/* Credits section */}
      <CollapsibleSection
        title="Credits"
        open={creditsOpen}
        onToggle={() => setCreditsOpen(!creditsOpen)}
      >
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Period</th>
              <th style={thStyle}>Credits granted</th>
              <th style={thStyle}>Credits used</th>
              <th style={thStyle}>Remaining credits</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>All time</td>
              <td style={tdStyle}>${granted.toFixed(2)}</td>
              <td style={tdStyle}>${used.toFixed(2)}</td>
              <td style={{ ...tdStyle, fontWeight: 600 }}>
                ${(balance ?? 0).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </CollapsibleSection>

      {/* Transaction history */}
      <CollapsibleSection
        title="Transaction History"
        open={historyOpen}
        onToggle={() => setHistoryOpen(!historyOpen)}
      >
        {ledger.length === 0 ? (
          <Text color="muted">No transactions yet.</Text>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((entry) => (
                <tr key={entry.id}>
                  <td style={tdStyle}>
                    {new Date(entry.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td style={tdStyle}>
                    <span style={typeBadge(entry.type)}>
                      {typeLabels[entry.type] || entry.type}
                    </span>
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      color: entry.amount >= 0 ? '#22c55e' : '#ef4444',
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {entry.amount >= 0 ? '+' : ''}${Math.abs(entry.amount).toFixed(2)}
                  </td>
                  <td style={tdStyle}>
                    <Text color="muted" size="sm">
                      {entry.reason || '—'}
                    </Text>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CollapsibleSection>
    </div>
  );
}

/* ─── Sub-components ─── */

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 140,
        padding: '16px 20px',
        border: `1px solid ${highlight ? '#FADB14' : 'var(--click-color-border-default, #e0e0e0)'}`,
        borderRadius: 8,
        background: highlight
          ? 'rgba(250, 219, 20, 0.06)'
          : 'var(--click-color-bg-panel, transparent)',
      }}
    >
      <Text color="muted" size="sm" style={{ display: 'block', marginBottom: 4 }}>
        {label}
      </Text>
      <Title type="h3">{value}</Title>
    </div>
  );
}

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: 28 }}>
      <button
        onClick={onToggle}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: 0,
          marginBottom: open ? 12 : 0,
          color: 'inherit',
        }}
      >
        <span
          style={{
            fontSize: 12,
            transition: 'transform 0.15s',
            transform: open ? 'rotate(90deg)' : 'rotate(0)',
            display: 'inline-block',
          }}
        >
          &#9654;
        </span>
        <Title type="h4">{title}</Title>
      </button>
      {open && children}
    </div>
  );
}

/* ─── Styles ─── */

const typeLabels: Record<string, string> = {
  [CreditEntryType.Grant]: 'Grant',
  [CreditEntryType.Deduct]: 'Deduction',
  [CreditEntryType.Purchase]: 'Purchase',
  [CreditEntryType.Refund]: 'Refund',
};

function typeBadge(type: string): React.CSSProperties {
  const colors: Record<string, { bg: string; fg: string }> = {
    [CreditEntryType.Grant]: { bg: '#dcfce7', fg: '#166534' },
    [CreditEntryType.Refund]: { bg: '#dbeafe', fg: '#1e40af' },
    [CreditEntryType.Purchase]: { bg: '#fef3c7', fg: '#92400e' },
    [CreditEntryType.Deduct]: { bg: '#fee2e2', fg: '#991b1b' },
  };
  const c = colors[type] || { bg: '#f3f4f6', fg: '#374151' };
  return {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    background: c.bg,
    color: c.fg,
  };
}

const cardRow: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  flexWrap: 'wrap',
  marginBottom: 8,
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 14px',
  borderBottom: '2px solid var(--click-color-border-default, #e0e0e0)',
  fontSize: 13,
  fontWeight: 600,
  background: 'var(--click-color-bg-panel, #fafafa)',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderBottom: '1px solid var(--click-color-border-default, #f0f0f0)',
  fontSize: 14,
};
