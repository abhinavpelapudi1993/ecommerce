import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Text } from '@clickhouse/click-ui';
import { PageContainer, BillingDashboard } from '@ecommerce/ui-components';
import { useServices, createCreditStore } from '@ecommerce/state-service';
import { useStore } from 'zustand';
import type { Customer } from '@ecommerce/data-client';

export function CustomerBillingPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const services = useServices();
  const store = useMemo(() => createCreditStore(services), [services]);
  const { balance, ledger, loading, fetchBalance } = useStore(store);
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (customerId) {
      fetchBalance(customerId);
      services.customerClient.getCustomer(customerId).then(setCustomer).catch(() => {});
    }
  }, [customerId]);

  if (!customerId) return <Text>No customer selected</Text>;

  const displayName = customer ? customer.name : `${customerId.substring(0, 8)}...`;

  return (
    <PageContainer
      title={`Billing — ${displayName}`}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to={`/customer/${customerId}`}>
            <Button type="secondary">View Full Profile</Button>
          </Link>
          <Link to={`/customer/${customerId}/credit`}>
            <Button>Manage Credit</Button>
          </Link>
        </div>
      }
    >
      {customer && (
        <div style={{ marginBottom: 20, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Text color="muted" size="sm">{customer.email}</Text>
          <Text color="muted" size="sm">ID: {customer.id}</Text>
        </div>
      )}

      <BillingDashboard
        customerName={displayName}
        balance={balance}
        ledger={ledger}
        loading={loading}
      />
    </PageContainer>
  );
}
