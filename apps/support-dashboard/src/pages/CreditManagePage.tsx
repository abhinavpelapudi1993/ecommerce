import { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Title, Text } from '@clickhouse/click-ui';
import {
  PageContainer,
  CreditBalanceDisplay,
  CreditAdjustForm,
  CreditLedgerTable,
} from '@ecommerce/ui-components';
import { useServices, createCreditStore } from '@ecommerce/state-service';
import { CreditEntryType } from '@ecommerce/data-client';
import { useStore } from 'zustand';

export function CreditManagePage() {
  const { customerId } = useParams<{ customerId: string }>();
  const services = useServices();
  const store = useMemo(() => createCreditStore(services), [services]);
  const { balance, ledger, loading, error, fetchBalance, grantCredit, deductCredit } =
    useStore(store);

  useEffect(() => {
    if (customerId) fetchBalance(customerId);
  }, [customerId]);

  if (!customerId) return <Text>No customer selected</Text>;

  const handleGrant = async (amount: number, reason: string) => {
    await grantCredit(customerId, amount, reason);
  };

  const handleDeduct = async (amount: number, reason: string) => {
    await deductCredit(customerId, amount, reason);
  };

  return (
    <PageContainer
      title="Manage Credit"
      actions={
        <Link to={`/customer/${customerId}`}>
          <Button>Back to Customer</Button>
        </Link>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600 }}>
        <CreditBalanceDisplay balance={balance} loading={loading} />

        {error && <Text color="danger">{error}</Text>}

        <div>
          <Title type="h4" style={{ marginBottom: 8 }}>
            Grant Credit
          </Title>
          <CreditAdjustForm type={CreditEntryType.Grant} onSubmit={handleGrant} loading={loading} />
        </div>

        <div>
          <Title type="h4" style={{ marginBottom: 8 }}>
            Deduct Credit
          </Title>
          <CreditAdjustForm type={CreditEntryType.Deduct} onSubmit={handleDeduct} loading={loading} />
        </div>

        <div>
          <Title type="h4" style={{ marginBottom: 8 }}>
            Credit History
          </Title>
          <CreditLedgerTable entries={ledger} />
        </div>
      </div>
    </PageContainer>
  );
}
