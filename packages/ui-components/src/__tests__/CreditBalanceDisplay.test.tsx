import { render, screen } from '@testing-library/react';
import { CreditBalanceDisplay } from '../credit/CreditBalanceDisplay';

describe('CreditBalanceDisplay', () => {
  it('shows loading state', () => {
    render(<CreditBalanceDisplay balance={null} loading={true} />);

    expect(screen.getByText('Loading balance...')).toBeInTheDocument();
  });

  it('shows no balance data when balance is null and not loading', () => {
    render(<CreditBalanceDisplay balance={null} />);

    expect(screen.getByText('No balance data')).toBeInTheDocument();
  });

  it('displays the formatted balance', () => {
    render(<CreditBalanceDisplay balance={5000} />);

    expect(screen.getByText('$5000.00')).toBeInTheDocument();
    expect(screen.getByText('Credit Balance')).toBeInTheDocument();
  });

  it('displays zero balance correctly', () => {
    render(<CreditBalanceDisplay balance={0} />);

    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });
});
