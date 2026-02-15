import { Link } from 'react-router-dom';
import { Title, Text } from '@clickhouse/click-ui';
import { PageContainer } from '@ecommerce/ui-components';
import { useSupportAuth } from '../auth-context';

export function DashboardPage() {
  const { user } = useSupportAuth();

  return (
    <PageContainer title="Support Dashboard">
      <div style={{ maxWidth: 600 }}>
        <Text style={{ display: 'block', marginBottom: 24 }}>
          Welcome back, {user?.name}. What would you like to do?
        </Text>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <NavCard
            to="/customers"
            title="Customers"
            description="Search customers by email or ID, view account details"
          />
          <NavCard
            to="/billing"
            title="Billing"
            description="Look up customer billing, credit balance, and transaction history"
          />
          <NavCard
            to="/products"
            title="Products"
            description="Add products, update prices, manage inventory"
          />
          <NavCard
            to="/promos"
            title="Promo Codes"
            description="Create and manage promotional codes"
          />
          <NavCard
            to="/refund-requests"
            title="Refund Requests"
            description="Review and approve customer refund requests"
          />
        </div>
      </div>
    </PageContainer>
  );
}

function NavCard({ to, title, description }: { to: string; title: string; description: string }) {
  return (
    <Link
      to={to}
      style={{
        display: 'block',
        padding: '16px 20px',
        border: '1px solid var(--click-color-border-default, #333)',
        borderRadius: 8,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#FADB14')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--click-color-border-default, #333)')}
    >
      <Title type="h4" style={{ marginBottom: 4 }}>{title}</Title>
      <Text color="muted" size="sm">{description}</Text>
    </Link>
  );
}
