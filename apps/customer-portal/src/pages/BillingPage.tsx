import { useEffect, useMemo } from 'react';
import { PageContainer, BillingDashboard } from '@ecommerce/ui-components';
import { useServices, createCreditStore } from '@ecommerce/state-service';
import { useStore } from 'zustand';
import { useCustomer } from '../customer-context';

export function BillingPage() {
  const { customer } = useCustomer();
  const services = useServices();
  const store = useMemo(() => createCreditStore(services), [services]);
  const { balance, ledger, loading, fetchBalance } = useStore(store);

  useEffect(() => {
    if (customer) fetchBalance(customer.id);
  }, [fetchBalance, customer]);

  return (
    <PageContainer title="Billing">
      <BillingDashboard
        customerName={customer?.name ?? ''}
        balance={balance}
        ledger={ledger}
        loading={loading}
      />
    </PageContainer>
  );
}
