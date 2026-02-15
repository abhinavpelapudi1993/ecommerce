import { createContext, useContext, useState, useCallback } from 'react';

export interface SupportUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const SUPPORT_USERS: SupportUser[] = [
  { id: 'd0a80001-0000-4000-8000-000000000001', name: 'Sarah Support', email: 'sarah@company.com', role: 'support' },
  { id: 'd0a80001-0000-4000-8000-000000000002', name: 'Mike Manager', email: 'mike@company.com', role: 'admin' },
  { id: 'd0a80001-0000-4000-8000-000000000003', name: 'Lisa Lead', email: 'lisa@company.com', role: 'support' },
];

const SESSION_KEY = 'support_user';

interface AuthContextValue {
  user: SupportUser | null;
  login: (userId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadSession(): SupportUser | null {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  return SUPPORT_USERS.find((u) => u.id === stored) ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupportUser | null>(loadSession);

  const login = useCallback((userId: string) => {
    const found = SUPPORT_USERS.find((u) => u.id === userId);
    if (found) {
      sessionStorage.setItem(SESSION_KEY, userId);
      setUser(found);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSupportAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useSupportAuth must be used within AuthProvider');
  return ctx;
}
