import { useEffect, useState } from 'react';
import { Title, Text } from '@clickhouse/click-ui';
import { PageContainer } from '@ecommerce/ui-components';
import { useServices } from '@ecommerce/state-service';
import { CompanyLedgerType } from '@ecommerce/data-client';
import type { CompanyBalanceResponse } from '@ecommerce/data-client';

export function CompanyBalancePage() {
  const { companyClient } = useServices();
  const [data, setData] = useState<CompanyBalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    companyClient
      .getBalance()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [companyClient]);

  if (loading) {
    return (
      <PageContainer title="Company Balance">
        <Text color="muted">Loading...</Text>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Company Balance">
        <Text color="danger">{error}</Text>
      </PageContainer>
    );
  }

  if (!data) return null;

  const grossSales = data.ledger
    .filter((e) => e.type === CompanyLedgerType.Sale)
    .reduce((sum, e) => sum + e.amount, 0);
  const totalRefunds = data.ledger
    .filter((e) => e.type === CompanyLedgerType.Refund)
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);
  const totalSales = grossSales - totalRefunds;
  const inEscrow = data.ledger
    .filter((e) => e.type === CompanyLedgerType.Escrow || e.type === CompanyLedgerType.EscrowRelease)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <PageContainer title="Company Balance">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
          <SummaryCard label="Net Balance" value={`$${data.balance.toFixed(2)}`} color="#22c55e" />
          <SummaryCard label="Net Sales" value={`$${totalSales.toFixed(2)}`} color="#3b82f6" />
          <SummaryCard label="Total Refunds" value={`$${totalRefunds.toFixed(2)}`} color="#ef4444" />
          <SummaryCard label="In Escrow" value={`$${inEscrow.toFixed(2)}`} color="#f59e0b" />
        </div>

        {/* Ledger table */}
        <div>
          <Title type="h3" style={{ marginBottom: 12 }}>Revenue Ledger</Title>
          {data.ledger.length === 0 ? (
            <Text color="muted">No entries yet.</Text>
          ) : (
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
                {data.ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td style={tdStyle}>
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#fff',
                          background: typeColor(entry.type),
                        }}
                      >
                        {entry.type}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <Text style={{ fontWeight: 500, color: entry.amount >= 0 ? '#22c55e' : '#ef4444' }}>
                        {entry.amount >= 0 ? '+' : ''}${entry.amount.toFixed(2)}
                      </Text>
                    </td>
                    <td style={tdStyle}>
                      <Text color="muted" size="sm">{entry.reason}</Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

function typeColor(type: string): string {
  switch (type) {
    case CompanyLedgerType.Sale: return '#22c55e';
    case CompanyLedgerType.Refund: return '#ef4444';
    case CompanyLedgerType.Escrow: return '#f59e0b';
    case CompanyLedgerType.EscrowRelease: return '#8b5cf6';
    default: return '#6b7280';
  }
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        padding: '16px 20px',
        border: '1px solid var(--click-color-border-default, #333)',
        borderRadius: 8,
      }}
    >
      <Text color="muted" size="sm" style={{ display: 'block', marginBottom: 4 }}>{label}</Text>
      <Title type="h2" style={{ color }}>{value}</Title>
    </div>
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
  verticalAlign: 'middle',
};
