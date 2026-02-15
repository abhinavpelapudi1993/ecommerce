import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Button, Text } from '@clickhouse/click-ui';
import { AppShell } from '@ecommerce/ui-components';
import { HomePage } from './pages/HomePage';
import { ProductPage } from './pages/ProductPage';
import { PurchaseHistoryPage } from './pages/PurchaseHistoryPage';
import { AccountPage } from './pages/AccountPage';
import { BillingPage } from './pages/BillingPage';
import { LoginPage } from './pages/LoginPage';
import { CustomerProvider, useCustomer } from './customer-context';

function Sidebar() {
  const { customer, logout } = useCustomer();

  if (!customer) return null;

  const linkStyle: React.CSSProperties = {
    display: 'block',
    padding: '8px 12px',
    borderRadius: 6,
    textDecoration: 'none',
    color: 'inherit',
    marginBottom: 4,
  };

  return (
    <nav>
      <div style={{ marginBottom: 20 }}>
        <Text size="sm" color="muted" style={{ display: 'block', marginBottom: 4 }}>
          Signed in as
        </Text>
        <Text style={{ display: 'block', fontWeight: 600 }}>{customer.name}</Text>
        <Text color="muted" size="sm" style={{ display: 'block', marginBottom: 8 }}>
          {customer.email}
        </Text>
        <Button type="secondary" onClick={logout}>
          Sign Out
        </Button>
      </div>

      <Text size="sm" color="muted" style={{ marginBottom: 12, display: 'block' }}>
        Navigation
      </Text>
      <Link to="/" style={linkStyle}>Products</Link>
      <Link to="/purchases" style={linkStyle}>My Purchases</Link>
      <Link to="/billing" style={linkStyle}>Billing</Link>
      <Link to="/account" style={linkStyle}>Account</Link>
    </nav>
  );
}

function AuthenticatedApp() {
  const { customer } = useCustomer();

  if (!customer) {
    return <LoginPage />;
  }

  return (
    <AppShell sidebar={<Sidebar />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:productId" element={<ProductPage />} />
        <Route path="/purchases" element={<PurchaseHistoryPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Routes>
    </AppShell>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <CustomerProvider>
        <AuthenticatedApp />
      </CustomerProvider>
    </BrowserRouter>
  );
}
