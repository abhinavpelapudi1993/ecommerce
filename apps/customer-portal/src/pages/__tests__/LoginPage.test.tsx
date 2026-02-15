import { render, screen } from '@testing-library/react';
import { LoginPage } from '../LoginPage';
import { CustomerProvider } from '../../customer-context';

describe('LoginPage', () => {
  it('renders the login screen with app name and demo accounts', () => {
    render(
      <CustomerProvider>
        <LoginPage />
      </CustomerProvider>,
    );

    expect(screen.getByText('E-Commerce Store')).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('Demo Accounts')).toBeInTheDocument();
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    expect(screen.getByText('Carol Davis')).toBeInTheDocument();
  });

  it('renders email input field', () => {
    render(
      <CustomerProvider>
        <LoginPage />
      </CustomerProvider>,
    );

    expect(screen.getByPlaceholderText('Enter your email...')).toBeInTheDocument();
  });
});
