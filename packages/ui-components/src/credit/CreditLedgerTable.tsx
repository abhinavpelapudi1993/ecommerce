import { Text } from '@clickhouse/click-ui';
import type { CreditLedgerEntry } from '@ecommerce/data-client';

interface CreditLedgerTableProps {
  entries: CreditLedgerEntry[];
}

const typeLabels: Record<string, string> = {
  grant: 'Credit Granted',
  deduct: 'Credit Deducted',
  purchase: 'Purchase',
  refund: 'Refund',
};

export function CreditLedgerTable({ entries }: CreditLedgerTableProps) {
  if (entries.length === 0) {
    return <Text color="muted">No credit history yet.</Text>;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={thStyle}>Date</th>
          <th style={thStyle}>Type</th>
          <th style={thStyle}>Amount</th>
          <th style={thStyle}>Reason</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id}>
            <td style={tdStyle}>
              {new Date(entry.createdAt).toLocaleDateString()}
            </td>
            <td style={tdStyle}>{typeLabels[entry.type] || entry.type}</td>
            <td
              style={{
                ...tdStyle,
                color: entry.amount >= 0 ? '#22c55e' : '#ef4444',
                fontWeight: 500,
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
  );
}

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
