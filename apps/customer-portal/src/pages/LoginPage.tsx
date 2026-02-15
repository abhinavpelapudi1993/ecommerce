import { LoginScreen } from '@ecommerce/ui-components';
import { DEMO_CUSTOMERS, useCustomer } from '../customer-context';

export function LoginPage() {
  const { login } = useCustomer();

  return (
    <LoginScreen
      appName="E-Commerce Store"
      users={DEMO_CUSTOMERS}
      onLogin={login}
    />
  );
}
