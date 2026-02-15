import { LoginScreen } from '@ecommerce/ui-components';
import { SUPPORT_USERS, useSupportAuth } from '../auth-context';

export function LoginPage() {
  const { login } = useSupportAuth();

  const users = SUPPORT_USERS.map((u) => ({
    id: u.id,
    name: `${u.name} (${u.role})`,
    email: u.email,
  }));

  return (
    <LoginScreen
      appName="Support Dashboard"
      users={users}
      onLogin={login}
    />
  );
}
