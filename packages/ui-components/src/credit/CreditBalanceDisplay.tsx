import { Title, Text } from '@clickhouse/click-ui';

interface CreditBalanceDisplayProps {
  balance: number | null;
  loading?: boolean;
}

export function CreditBalanceDisplay({ balance, loading }: CreditBalanceDisplayProps) {
  if (loading) {
    return <Text color="muted">Loading balance...</Text>;
  }

  if (balance === null) {
    return <Text color="muted">No balance data</Text>;
  }

  return (
    <div
      style={{
        padding: 16,
        border: '1px solid var(--click-color-border-default, #e0e0e0)',
        borderRadius: 8,
        textAlign: 'center',
      }}
    >
      <Text color="muted" size="sm">
        Credit Balance
      </Text>
      <Title type="h2">${balance.toFixed(2)}</Title>
    </div>
  );
}
