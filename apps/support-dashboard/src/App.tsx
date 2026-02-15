import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Button, Text } from '@clickhouse/click-ui';
import { AppShell } from '@ecommerce/ui-components';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { BillingSearchPage } from './pages/BillingSearchPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { CustomerBillingPage } from './pages/CustomerBillingPage';
import { CreditManagePage } from './pages/CreditManagePage';
import { PromoManagePage } from './pages/PromoManagePage';
import { ProductsPage } from './pages/ProductsPage';
import { RefundRequestsPage } from './pages/RefundRequestsPage';
import { CompanyBalancePage } from './pages/CompanyBalancePage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useSupportAuth } from './auth-context';

function Sidebar() {
  const { user, logout } = useSupportAuth();

  if (!user) return null;

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
        <Text style={{ display: 'block', fontWeight: 600 }}>{user.name}</Text>
        <Text color="muted" size="sm" style={{ display: 'block', marginBottom: 2 }}>
          {user.role}
        </Text>
        <Text color="muted" size="sm" style={{ display: 'block', marginBottom: 8 }}>
          {user.email}
        </Text>
        <Button type="secondary" onClick={logout}>
          Sign Out
        </Button>
      </div>

      <Text size="sm" color="muted" style={{ marginBottom: 8, display: 'block' }}>
        Navigation
      </Text>
      <Link to="/" style={linkStyle}>Home</Link>
      <Link to="/customers" style={linkStyle}>Customers</Link>
      <Link to="/billing" style={linkStyle}>Billing</Link>
      <Link to="/products" style={linkStyle}>Products</Link>
      <Link to="/promos" style={linkStyle}>Promo Codes</Link>
      <Link to="/refund-requests" style={linkStyle}>Refund Requests</Link>
      <Link to="/company" style={linkStyle}>Company Balance</Link>
    </nav>
  );
}

function AuthenticatedApp() {
  const { user } = useSupportAuth();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <AppShell sidebar={<Sidebar />}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/billing" element={<BillingSearchPage />} />
        <Route path="/customer/:customerId" element={<CustomerDetailPage />} />
        <Route path="/customer/:customerId/billing" element={<CustomerBillingPage />} />
        <Route path="/customer/:customerId/credit" element={<CreditManagePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/promos" element={<PromoManagePage />} />
        <Route path="/refund-requests" element={<RefundRequestsPage />} />
        <Route path="/company" element={<CompanyBalancePage />} />
      </Routes>
    </AppShell>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </BrowserRouter>
  );
}
