import { createContext, useContext, useState, useCallback } from 'react';

export interface DemoCustomer {
  id: string;
  name: string;
  email: string;
}

export const DEMO_CUSTOMERS: DemoCustomer[] = [
  { id: 'c0a80001-0000-4000-8000-000000000001', name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 'c0a80001-0000-4000-8000-000000000002', name: 'Bob Smith', email: 'bob@example.com' },
  { id: 'c0a80001-0000-4000-8000-000000000003', name: 'Carol Davis', email: 'carol@example.com' },
];

const SESSION_KEY = 'ecommerce_customer';

interface CustomerContextValue {
  customer: DemoCustomer | null;
  login: (id: string) => void;
  logout: () => void;
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

function loadSession(): DemoCustomer | null {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  return DEMO_CUSTOMERS.find((c) => c.id === stored) ?? null;
}

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<DemoCustomer | null>(loadSession);

  const login = useCallback((id: string) => {
    const found = DEMO_CUSTOMERS.find((c) => c.id === id);
    if (found) {
      sessionStorage.setItem(SESSION_KEY, id);
      setCustomer(found);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setCustomer(null);
  }, []);

  return (
    <CustomerContext.Provider value={{ customer, login, logout }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used within CustomerProvider');
  return ctx;
}
