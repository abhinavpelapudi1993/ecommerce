import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../DashboardPage';

// Mock the auth context
vi.mock('../../auth-context', () => ({
  useSupportAuth: () => ({
    user: { id: 'd-001', name: 'Sarah Support', email: 'sarah@company.com', role: 'support' },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe('DashboardPage', () => {
  it('renders welcome message with user name', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Welcome back, Sarah Support/)).toBeInTheDocument();
  });

  it('renders navigation cards for all sections', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Promo Codes')).toBeInTheDocument();
    expect(screen.getByText('Refund Requests')).toBeInTheDocument();
  });
});
