import { render, screen } from '@testing-library/react';
import { LoginPage } from '../LoginPage';
import { AuthProvider } from '../../auth-context';

describe('LoginPage', () => {
  it('renders the login screen with support dashboard name', () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    expect(screen.getByText('Support Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('Demo Accounts')).toBeInTheDocument();
  });

  it('renders support users with roles', () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    expect(screen.getByText('Sarah Support (support)')).toBeInTheDocument();
    expect(screen.getByText('Mike Manager (admin)')).toBeInTheDocument();
    expect(screen.getByText('Lisa Lead (support)')).toBeInTheDocument();
  });
});
